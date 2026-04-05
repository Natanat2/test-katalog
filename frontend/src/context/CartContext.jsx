import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  addCartItem,
  deleteCartItem,
  fetchCart,
  updateCartItem
} from '../services/api';
import { CART_SNAPSHOT_KEY, getStoredJSON, setStoredJSON, toNumber } from '../utils/helpers';

const CartContext = createContext(null);

function toMoneyString(value) {
  return toNumber(value).toFixed(2);
}

function computeTotals(items) {
  const total = items.reduce((sum, item) => {
    const lineTotal = item.line_total ?? toNumber(item.product?.price) * item.quantity;
    return sum + toNumber(lineTotal);
  }, 0);

  return toMoneyString(total);
}

function makeOptimisticCart(currentCart) {
  if (currentCart) {
    return currentCart;
  }

  return {
    id: 0,
    session_id: 'pending',
    total_price: '0.00',
    items: []
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => getStoredJSON(CART_SNAPSHOT_KEY, null));
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    if (cart) {
      setStoredJSON(CART_SNAPSHOT_KEY, cart);
    }
  }, [cart]);

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const remoteCart = await fetchCart();
      setCart(remoteCart);
    } catch (error) {
      toast.error(error.message || 'Не удалось загрузить корзину.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(
    async (product, quantity = 1, options = {}) => {
      const { silentSuccess = false } = options;
      const previous = cart;
      const baseCart = makeOptimisticCart(previous);
      const existing = baseCart.items.find((item) => item.product.id === product.id);

      let optimisticItems;
      if (existing) {
        optimisticItems = baseCart.items.map((item) => {
          if (item.id !== existing.id) {
            return item;
          }
          const nextQuantity = item.quantity + quantity;
          return {
            ...item,
            quantity: nextQuantity,
            line_total: toMoneyString(toNumber(item.product.price) * nextQuantity)
          };
        });
      } else {
        optimisticItems = [
          ...baseCart.items,
          {
            id: -(Date.now() + product.id),
            quantity,
            line_total: toMoneyString(toNumber(product.price) * quantity),
            product
          }
        ];
      }

      const optimistic = {
        ...baseCart,
        items: optimisticItems,
        total_price: computeTotals(optimisticItems)
      };

      setCart(optimistic);
      setIsMutating(true);

      try {
        const remoteCart = await addCartItem({ product_id: product.id, quantity });
        setCart(remoteCart);
        if (!silentSuccess) {
          toast.success('Товар добавлен в корзину.');
        }
      } catch (error) {
        setCart(previous);
        toast.error(error.message || 'Не удалось добавить товар в корзину.');
      } finally {
        setIsMutating(false);
      }
    },
    [cart]
  );

  const updateItemQuantity = useCallback(
    async (itemId, quantity) => {
      if (quantity < 1 || !cart) {
        return;
      }

      const previous = cart;
      const optimisticItems = cart.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          quantity,
          line_total: toMoneyString(toNumber(item.product.price) * quantity)
        };
      });

      const optimistic = {
        ...cart,
        items: optimisticItems,
        total_price: computeTotals(optimisticItems)
      };

      setCart(optimistic);
      setIsMutating(true);

      try {
        const remoteCart = await updateCartItem(itemId, { quantity });
        setCart(remoteCart);
      } catch (error) {
        setCart(previous);
        toast.error(error.message || 'Не удалось обновить количество.');
      } finally {
        setIsMutating(false);
      }
    },
    [cart]
  );

  const removeFromCart = useCallback(
    async (itemId) => {
      if (!cart) {
        return;
      }

      const previous = cart;
      const optimisticItems = cart.items.filter((item) => item.id !== itemId);
      const optimistic = {
        ...cart,
        items: optimisticItems,
        total_price: computeTotals(optimisticItems)
      };

      setCart(optimistic);
      setIsMutating(true);

      try {
        const remoteCart = await deleteCartItem(itemId);
        setCart(remoteCart);
      } catch (error) {
        setCart(previous);
        toast.error(error.message || 'Не удалось удалить товар из корзины.');
      } finally {
        setIsMutating(false);
      }
    },
    [cart]
  );

  const clearCart = useCallback(async () => {
    if (!cart || cart.items.length === 0) {
      return;
    }

    const previous = cart;
    const optimistic = {
      ...cart,
      items: [],
      total_price: '0.00'
    };

    setCart(optimistic);
    setIsMutating(true);

    let mutationError = null;
    try {
      for (const item of previous.items) {
        try {
          await deleteCartItem(item.id);
        } catch (error) {
          mutationError = error;
          break;
        }
      }
    } finally {
      try {
        const remoteCart = await fetchCart();
        setCart(remoteCart);
      } catch (refreshError) {
        setCart(previous);
        toast.error(refreshError.message || 'Не удалось обновить корзину после очистки.');
        setIsMutating(false);
        return;
      }

      if (mutationError) {
        toast.error(mutationError.message || 'Не удалось полностью очистить корзину.');
      } else {
        toast.success('Корзина очищена.');
      }

      setIsMutating(false);
    }
  }, [cart]);

  const value = useMemo(() => {
    const items = cart?.items || [];
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cart,
      items,
      itemCount,
      totalPrice: cart?.total_price || '0.00',
      isLoading,
      isMutating,
      refreshCart,
      addToCart,
      updateItemQuantity,
      removeFromCart,
      clearCart
    };
  }, [addToCart, cart, clearCart, isLoading, isMutating, refreshCart, removeFromCart, updateItemQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}

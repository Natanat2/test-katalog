import { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';

import { useCart } from '../context/CartContext';
import { applyProductImageFallback, formatPrice, resolveProductImage } from '../utils/helpers';

export default function Cart({ open, onClose }) {
  const {
    items,
    totalPrice,
    isLoading,
    isMutating,
    updateItemQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const { setNodeRef, isOver } = useDroppable({ id: 'cart-dropzone' });

  useEffect(() => {
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', onKeydown);
    }

    return () => window.removeEventListener('keydown', onKeydown);
  }, [onClose, open]);

  return (
    <>
      <div
        className={`cart-overlay ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <header className="cart-drawer__header">
          <h2 id="cart-title">Корзина</h2>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div
          ref={setNodeRef}
          className={`cart-dropzone ${isOver ? 'is-over' : ''}`}
        >
          Перетащите карточку товара сюда
        </div>

        {(isLoading || isMutating) && (
          <p className="cart-drawer__status" aria-live="polite">
            Обновляем корзину...
          </p>
        )}

        <div className="cart-drawer__body">
          {items.length === 0 && <p className="cart-drawer__empty">Корзина пока пуста.</p>}

          {items.map((item) => (
            <article key={item.id} className="cart-item">
              <img
                src={resolveProductImage(item.product.image)}
                alt={item.product.name}
                onError={applyProductImageFallback}
              />

              <div className="cart-item__content">
                <h3>{item.product.name}</h3>
                <p>{formatPrice(item.product.price)}</p>

                <div className="cart-item__controls">
                  <button
                    type="button"
                    aria-label={`Уменьшить количество товара ${item.product.name}`}
                    onClick={() => {
                      if (item.quantity === 1) {
                        removeFromCart(item.id);
                        return;
                      }
                      updateItemQuantity(item.id, item.quantity - 1);
                    }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Увеличить количество товара ${item.product.name}`}
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-item__remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>

        <footer className="cart-drawer__footer">
          <p>Итого: {formatPrice(totalPrice)}</p>
          <button type="button" disabled={items.length === 0} onClick={clearCart}>
            Очистить корзину
          </button>
        </footer>
      </aside>
    </>
  );
}

import { DndContext, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

import Cart from './components/Cart';
import Notifications from './components/Notifications';
import SeoRouteUpdater from './components/SeoRouteUpdater';
import { CartProvider, useCart } from './context/CartContext';
import { CompareProvider, useCompare } from './context/CompareContext';
import ComparePage from './pages/ComparePage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import { formatPrice, resolveProductImage } from './utils/helpers';

const CART_DRAWER_DROPZONE_ID = 'cart-dropzone';
const CART_BUTTON_DROPZONE_ID = 'cart-button-dropzone';

function toRect(rect) {
  if (!rect) {
    return null;
  }

  const { left, top, width, height } = rect;
  if ([left, top, width, height].some((value) => typeof value !== 'number' || Number.isNaN(value))) {
    return null;
  }

  return { left, top, width, height };
}

function getDropTargetRect(dropTargetId, overRect) {
  if (dropTargetId === CART_BUTTON_DROPZONE_ID) {
    const cartButton = document.querySelector('.app-header__cart');
    const buttonRect = cartButton ? toRect(cartButton.getBoundingClientRect()) : null;
    if (buttonRect) {
      return buttonRect;
    }
  }

  const rectFromOver = toRect(overRect);
  if (rectFromOver) {
    return rectFromOver;
  }

  const selector =
    dropTargetId === CART_DRAWER_DROPZONE_ID ? '.cart-dropzone' : '.app-header__cart';
  const target = document.querySelector(selector);
  if (!target) {
    return null;
  }

  return toRect(target.getBoundingClientRect());
}

function getFlyDuration(fromRect, toRectTarget) {
  const fromCenterX = fromRect.left + fromRect.width / 2;
  const fromCenterY = fromRect.top + fromRect.height / 2;
  const toCenterX = toRectTarget.left + toRectTarget.width / 2;
  const toCenterY = toRectTarget.top + toRectTarget.height / 2;
  const distance = Math.hypot(toCenterX - fromCenterX, toCenterY - fromCenterY);

  return Math.round(Math.min(760, Math.max(420, distance * 0.95)));
}

function DragPreview({ product }) {
  return (
    <article className="product-drag-preview" aria-hidden="true">
      <img src={resolveProductImage(product.image)} alt={product.name} />
      <h4>{product.name}</h4>
      <p>{formatPrice(product.price)}</p>
      <small>{product.category}</small>
    </article>
  );
}

function CartDropButton({ itemCount, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: CART_BUTTON_DROPZONE_ID });

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`app-header__cart ${isOver ? 'is-over' : ''}`}
      onClick={onOpen}
    >
      Корзина ({itemCount})
    </button>
  );
}

function CartDropFlyEffect({ effect, onFinish }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!effect) {
      return undefined;
    }

    setIsAnimating(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsAnimating(true));
    });
    const timer = window.setTimeout(onFinish, (effect.duration || 430) + 70);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [effect, onFinish]);

  if (!effect) {
    return null;
  }

  const fromCenterX = effect.fromRect.left + effect.fromRect.width / 2;
  const fromCenterY = effect.fromRect.top + effect.fromRect.height / 2;
  const toCenterX = effect.toRect.left + effect.toRect.width / 2;
  const toCenterY = effect.toRect.top + effect.toRect.height / 2;

  return (
    <div
      className={`cart-drop-fly-effect ${isAnimating ? 'is-active' : ''}`}
      style={{
        left: `${effect.fromRect.left}px`,
        top: `${effect.fromRect.top}px`,
        width: `${effect.fromRect.width}px`,
        height: `${effect.fromRect.height}px`,
        '--fly-x': `${toCenterX - fromCenterX}px`,
        '--fly-y': `${toCenterY - fromCenterY}px`,
        '--fly-duration': `${effect.duration || 430}ms`,
        '--fly-opacity-duration': `${Math.round((effect.duration || 430) * 0.82)}ms`
      }}
      aria-hidden="true"
    >
      <img src={resolveProductImage(effect.product.image)} alt="" />
    </div>
  );
}

function AppShell() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeDragProduct, setActiveDragProduct] = useState(null);
  const [activeDragStartRect, setActiveDragStartRect] = useState(null);
  const [dropFlyEffect, setDropFlyEffect] = useState(null);
  const { addToCart, itemCount } = useCart();
  const { compareCount } = useCompare();
  const clearDropFlyEffect = useCallback(() => setDropFlyEffect(null), []);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => {
        const product = active?.data?.current?.product;
        if (product) {
          setActiveDragProduct(product);
        }

        const dragRect = toRect(active?.rect?.current?.initial);
        setActiveDragStartRect(dragRect);
      }}
      onDragCancel={() => {
        setActiveDragProduct(null);
        setActiveDragStartRect(null);
      }}
      onDragEnd={({ active, over }) => {
        const product = active?.data?.current?.product || activeDragProduct;
        const dropTargetId = over?.id;
        const isCartDropzone =
          dropTargetId === CART_DRAWER_DROPZONE_ID || dropTargetId === CART_BUTTON_DROPZONE_ID;
        const fromRect = toRect(active?.rect?.current?.initial) || activeDragStartRect;
        const toRectTarget = getDropTargetRect(dropTargetId, over?.rect);

        if (isCartDropzone && product) {
          if (fromRect && toRectTarget) {
            setDropFlyEffect({
              id: `${Date.now()}-${Math.random()}`,
              product,
              fromRect,
              toRect: toRectTarget,
              duration: getFlyDuration(fromRect, toRectTarget)
            });
          }

          addToCart(product, 1, { silentSuccess: true });
        }

        setActiveDragProduct(null);
        setActiveDragStartRect(null);
      }}
    >
      <SeoRouteUpdater />
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header__brand">
            <span>TK</span>
            <p>
              Test Katalog
              <small>Интерактивный каталог</small>
            </p>
          </div>

          <nav className="app-header__nav">
            <NavLink to="/" end>
              Каталог
            </NavLink>
            <NavLink to="/compare">Сравнение ({compareCount})</NavLink>
          </nav>

          <CartDropButton itemCount={itemCount} onOpen={() => setIsCartOpen(true)} />
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>

        <Cart open={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <Notifications />
      </div>
      <CartDropFlyEffect
        key={dropFlyEffect?.id ?? 'drop-fly-empty'}
        effect={dropFlyEffect}
        onFinish={clearDropFlyEffect}
      />
      <DragOverlay dropAnimation={null}>
        {activeDragProduct ? <DragPreview product={activeDragProduct} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function App() {
  return (
    <CompareProvider>
      <CartProvider>
        <AppShell />
      </CartProvider>
    </CompareProvider>
  );
}

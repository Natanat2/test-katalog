import { DndContext } from '@dnd-kit/core';
import { useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';

import Cart from './components/Cart';
import Notifications from './components/Notifications';
import { CartProvider, useCart } from './context/CartContext';
import { CompareProvider, useCompare } from './context/CompareContext';
import ComparePage from './pages/ComparePage';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';

function AppShell() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, itemCount } = useCart();
  const { compareCount } = useCompare();

  return (
    <DndContext
      onDragEnd={({ active, over }) => {
        if (over?.id !== 'cart-dropzone') {
          return;
        }

        const product = active?.data?.current?.product;
        if (!product) {
          return;
        }

        addToCart(product, 1, { silentSuccess: true });
        setIsCartOpen(true);
      }}
    >
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

          <button type="button" className="app-header__cart" onClick={() => setIsCartOpen(true)}>
            Корзина ({itemCount})
          </button>
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
    </DndContext>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CompareProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </CompareProvider>
    </BrowserRouter>
  );
}

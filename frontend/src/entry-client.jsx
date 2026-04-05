import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

import App from './App';
import { SsrDataProvider } from './context/SsrDataContext';
import './styles/main.scss';

const initialSsrData =
  typeof window !== 'undefined' && window.__SSR_DATA__ && typeof window.__SSR_DATA__ === 'object'
    ? window.__SSR_DATA__
    : {};

const app = (
  <StrictMode>
    <SsrDataProvider data={initialSsrData}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SsrDataProvider>
  </StrictMode>
);

const container = document.getElementById('root');

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

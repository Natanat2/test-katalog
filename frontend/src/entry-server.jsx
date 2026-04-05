import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

import App from './App';
import { SsrDataProvider } from './context/SsrDataContext';
import { buildSeoHead } from './utils/seo';

const SSR_API_URL = process.env.SSR_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    return null;
  }

  if (typeof product.id !== 'number') {
    return null;
  }

  return product;
}

async function loadProductForSsr(url) {
  const pathname = new URL(url, 'http://localhost').pathname;
  const match = pathname.match(/^\/products\/(\d+)\/?$/);
  if (!match) {
    return null;
  }

  const productId = Number(match[1]);
  if (!Number.isInteger(productId) || productId <= 0) {
    return null;
  }

  try {
    const response = await fetch(`${SSR_API_URL}/api/products/${productId}/`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return normalizeProduct(payload);
  } catch {
    return null;
  }
}

export async function render(url) {
  const currentProduct = await loadProductForSsr(url);
  const ssrData = currentProduct
    ? {
        productsById: {
          [String(currentProduct.id)]: currentProduct
        },
        currentProduct
      }
    : {
        productsById: {},
        currentProduct: null
      };

  const appHtml = renderToString(
    <SsrDataProvider data={ssrData}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </SsrDataProvider>
  );

  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';
  const headTags = buildSeoHead(url, baseUrl, {
    currentProduct
  });

  return {
    html: appHtml,
    headTags,
    ssrData
  };
}

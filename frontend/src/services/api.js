import axios from 'axios';

import {
  AUTH_TOKEN_KEY,
  CART_SESSION_KEY,
  buildQueryParams,
  getStoredValue,
  removeStoredValue,
  setStoredValue
} from '../utils/helpers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

function getSessionId() {
  return getStoredValue(CART_SESSION_KEY);
}

function setSessionId(sessionId) {
  if (sessionId) {
    setStoredValue(CART_SESSION_KEY, sessionId);
  }
}

function getAccessToken() {
  return getStoredValue(AUTH_TOKEN_KEY);
}

export function setAccessToken(accessToken) {
  if (accessToken) {
    setStoredValue(AUTH_TOKEN_KEY, accessToken);
  }
}

export function clearAccessToken() {
  removeStoredValue(AUTH_TOKEN_KEY);
}

export function clearSessionId() {
  removeStoredValue(CART_SESSION_KEY);
}

function normalizeApiError(error) {
  if (!error.response) {
    return {
      status: 0,
      message: 'Сервер недоступен. Проверьте подключение.',
      code: 'network_error',
      fields: {}
    };
  }

  const payload = error.response.data || {};
  return {
    status: error.response.status,
    message: payload.detail || 'Произошла ошибка при запросе.',
    code: payload.code || `http_${error.response.status}`,
    fields: payload.fields || {}
  };
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const sessionId = getSessionId();
  if (sessionId) {
    config.headers['X-Session-Id'] = sessionId;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const headerSessionId = response.headers['x-session-id'];
    const bodySessionId =
      response.data && typeof response.data === 'object' ? response.data.session_id : null;
    const sessionId = headerSessionId || bodySessionId;
    setSessionId(sessionId);
    return response;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

export async function fetchProducts(params = {}) {
  const response = await apiClient.get('/products/', {
    params: buildQueryParams(params)
  });
  return response.data;
}

export async function fetchProduct(productId) {
  const response = await apiClient.get(`/products/${productId}/`);
  return response.data;
}

export async function fetchCart() {
  const response = await apiClient.get('/cart/');
  return response.data;
}

export async function addCartItem(payload) {
  const response = await apiClient.post('/cart/', payload);
  return response.data;
}

export async function updateCartItem(itemId, payload) {
  const response = await apiClient.put(`/cart/${itemId}/`, payload);
  return response.data;
}

export async function deleteCartItem(itemId) {
  const response = await apiClient.delete(`/cart/${itemId}/`);
  return response.data;
}

export async function fetchAutocomplete(query) {
  const response = await apiClient.get('/products/', {
    params: buildQueryParams({
      q: query,
      limit: 6,
      offset: 0,
      ordering: 'name'
    })
  });
  return response.data.results;
}

export async function fetchCategories(limit = 100) {
  const categories = new Set();
  let offset = 0;
  const maxPages = 50;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await apiClient.get('/products/', {
      params: {
        limit,
        offset,
        ordering: 'name'
      }
    });

    const results = Array.isArray(response.data?.results) ? response.data.results : [];
    results.forEach((item) => {
      if (item?.category) {
        categories.add(item.category);
      }
    });

    if (results.length < limit || !response.data?.next) {
      break;
    }

    offset += limit;
  }

  return [...categories].sort((a, b) => a.localeCompare(b, 'ru'));
}

export async function registerUser(payload) {
  const response = await apiClient.post('/auth/register', payload);
  setAccessToken(response.data?.access_token);
  return response.data;
}

export async function loginUser(payload) {
  const response = await apiClient.post('/auth/login', payload);
  setAccessToken(response.data?.access_token);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export { API_URL };

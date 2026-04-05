import { useEffect, useState } from 'react';

export const CART_SESSION_KEY = 'catalog_session_id';
export const CART_SNAPSHOT_KEY = 'catalog_cart_snapshot';
export const COMPARE_IDS_KEY = 'catalog_compare_ids';
export const AUTH_TOKEN_KEY = 'catalog_access_token';
export const AUTH_USER_KEY = 'catalog_auth_user';
export const PRODUCT_PLACEHOLDER_IMAGE = '/images/product-placeholder.svg';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const currencyFormatter = new Intl.NumberFormat('ru-KZ', {
  style: 'currency',
  currency: 'KZT',
  maximumFractionDigits: 2
});

export function formatPrice(value) {
  const number = Number(value ?? 0);
  if (Number.isNaN(number)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(number);
}

export function resolveProductImage(image) {
  if (typeof image !== 'string') {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  const normalized = image.trim();
  return normalized.length > 0 ? normalized : PRODUCT_PLACEHOLDER_IMAGE;
}

export function applyProductImageFallback(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = PRODUCT_PLACEHOLDER_IMAGE;
}

export function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function useDebouncedValue(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function buildQueryParams(params) {
  const cleanParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    cleanParams[key] = value;
  });

  return cleanParams;
}

export function getStoredJSON(key, fallback) {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredJSON(key, value) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredValue(key, fallback = null) {
  if (!canUseStorage()) {
    return fallback;
  }

  const value = localStorage.getItem(key);
  return value === null ? fallback : value;
}

export function setStoredValue(key, value) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.setItem(key, value);
}

export function removeStoredValue(key) {
  if (!canUseStorage()) {
    return;
  }

  localStorage.removeItem(key);
}

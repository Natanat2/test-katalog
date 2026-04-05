import { useEffect, useState } from 'react';

export const CART_SESSION_KEY = 'catalog_session_id';
export const CART_SNAPSHOT_KEY = 'catalog_cart_snapshot';
export const COMPARE_IDS_KEY = 'catalog_compare_ids';

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2
});

export function formatPrice(value) {
  const number = Number(value ?? 0);
  if (Number.isNaN(number)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(number);
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
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

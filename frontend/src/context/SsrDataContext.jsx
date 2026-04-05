import { createContext, useContext, useMemo } from 'react';

const EMPTY_STATE = {
  productsById: {},
  currentProduct: null
};

const SsrDataContext = createContext({
  data: EMPTY_STATE,
  getProductById: () => null
});

export function SsrDataProvider({ data, children }) {
  const safeData = data && typeof data === 'object' ? data : EMPTY_STATE;
  const productsById =
    safeData.productsById && typeof safeData.productsById === 'object' ? safeData.productsById : {};

  const value = useMemo(
    () => ({
      data: safeData,
      getProductById: (productId) => {
        if (productId === null || productId === undefined) {
          return null;
        }
        return productsById[String(productId)] || null;
      }
    }),
    [productsById, safeData]
  );

  return <SsrDataContext.Provider value={value}>{children}</SsrDataContext.Provider>;
}

export function useSsrData() {
  return useContext(SsrDataContext);
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { COMPARE_IDS_KEY, getStoredJSON, setStoredJSON } from '../utils/helpers';

const MAX_COMPARE_ITEMS = 4;
const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState(() => getStoredJSON(COMPARE_IDS_KEY, []));

  useEffect(() => {
    setStoredJSON(COMPARE_IDS_KEY, selectedIds);
  }, [selectedIds]);

  const toggleCompare = useCallback((productId) => {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast.info(`Можно сравнить не более ${MAX_COMPARE_ITEMS} товаров.`);
        return prev;
      }

      return [...prev, productId];
    });
  }, []);

  const clearCompare = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedIds,
      compareCount: selectedIds.length,
      isCompared: (productId) => selectedIds.includes(productId),
      toggleCompare,
      clearCompare,
      maxCompareItems: MAX_COMPARE_ITEMS
    }),
    [clearCompare, selectedIds, toggleCompare]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used inside CompareProvider');
  }
  return context;
}

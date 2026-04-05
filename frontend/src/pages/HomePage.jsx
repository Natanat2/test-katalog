import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import FilterPanel from '../components/FilterPanel';
import CatalogSkeleton from '../components/CatalogSkeleton';
import Pagination from '../components/Pagination';
import ProductList from '../components/ProductList';
import SearchBar from '../components/SearchBar';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { fetchAutocomplete, fetchCategories, fetchProducts } from '../services/api';
import { useDebouncedValue } from '../utils/helpers';

const DEFAULT_LIMIT = 20;
const ALLOWED_ORDERING = new Set(['name', '-name', 'price', '-price']);

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeOrdering(ordering) {
  if (ALLOWED_ORDERING.has(ordering)) {
    return ordering;
  }
  return 'name';
}

function updateSearchParams(setSearchParams, updater) {
  setSearchParams((previous) => {
    const params = new URLSearchParams(previous);
    updater(params);
    return params;
  });
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { toggleCompare, isCompared } = useCompare();

  const [productsResponse, setProductsResponse] = useState({
    count: 0,
    next: null,
    previous: null,
    results: []
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const debouncedAutocomplete = useDebouncedValue(searchInput, 250);

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('min_price') || '',
      maxPrice: searchParams.get('max_price') || '',
      ordering: normalizeOrdering(searchParams.get('ordering') || 'name'),
      limit: parseNumber(searchParams.get('limit'), DEFAULT_LIMIT) || DEFAULT_LIMIT,
      offset: parseNumber(searchParams.get('offset'), 0)
    }),
    [searchParams]
  );

  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (debouncedSearch.trim() === filters.q.trim()) {
      return;
    }

    updateSearchParams(setSearchParams, (params) => {
      const value = debouncedSearch.trim();

      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }

      params.set('offset', '0');
      if (!params.get('limit')) {
        params.set('limit', String(DEFAULT_LIMIT));
      }
    });
  }, [debouncedSearch, filters.q, setSearchParams]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const response = await fetchProducts({
          limit: filters.limit,
          offset: filters.offset,
          ordering: filters.ordering,
          category: filters.category || undefined,
          min_price: filters.minPrice || undefined,
          max_price: filters.maxPrice || undefined,
          q: filters.q || undefined
        });

        if (active) {
          setProductsResponse(response);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Не удалось загрузить каталог.');
          toast.error(requestError.message || 'Не удалось загрузить каталог.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [filters.category, filters.limit, filters.maxPrice, filters.minPrice, filters.offset, filters.ordering, filters.q]);

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((result) => {
        if (active) {
          setCategories(result);
        }
      })
      .catch(() => {
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const value = debouncedAutocomplete.trim();
    if (!value) {
      setSuggestions([]);
      return;
    }

    let active = true;
    setLoadingSuggestions(true);

    fetchAutocomplete(value)
      .then((items) => {
        if (active) {
          setSuggestions(items);
        }
      })
      .catch(() => {
        if (active) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingSuggestions(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedAutocomplete]);

  const updateFilters = (patch) => {
    updateSearchParams(setSearchParams, (params) => {
      const mapping = {
        category: 'category',
        minPrice: 'min_price',
        maxPrice: 'max_price',
        ordering: 'ordering'
      };

      Object.entries(patch).forEach(([key, value]) => {
        const queryKey = mapping[key];
        if (!queryKey) {
          return;
        }

        if (value === '' || value === undefined || value === null || value === 'name' && queryKey === 'ordering') {
          params.delete(queryKey);
        } else {
          params.set(queryKey, value);
        }
      });

      params.set('offset', '0');
      if (!params.get('limit')) {
        params.set('limit', String(DEFAULT_LIMIT));
      }
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSuggestions([]);
    setSearchParams({
      limit: String(DEFAULT_LIMIT),
      offset: '0'
    });
  };

  const handleSearchSubmit = (value) => {
    const normalized = value.trim();
    setSearchInput(value);

    updateSearchParams(setSearchParams, (params) => {
      if (normalized) {
        params.set('q', normalized);
      } else {
        params.delete('q');
      }

      params.set('offset', '0');
      if (!params.get('limit')) {
        params.set('limit', String(DEFAULT_LIMIT));
      }
    });
  };

  const handlePageChange = (nextOffset) => {
    updateSearchParams(setSearchParams, (params) => {
      params.set('offset', String(Math.max(0, nextOffset)));
      if (!params.get('limit')) {
        params.set('limit', String(DEFAULT_LIMIT));
      }
    });
  };

  return (
    <section className="home-page">
      <div className="home-page__hero">
        <p>Онлайн-каталог</p>
        <h1>Интерактивный каталог товаров</h1>
        <span>{productsResponse.count} товаров в выдаче</span>
      </div>

      <SearchBar
        value={searchInput}
        onChange={setSearchInput}
        onSubmit={handleSearchSubmit}
        suggestions={suggestions}
        onSelectSuggestion={(name) => {
          setSearchInput(name);
          handleSearchSubmit(name);
        }}
        loading={loadingSuggestions}
      />

      <div className="home-page__layout">
        <FilterPanel
          filters={filters}
          categories={categories}
          onChange={updateFilters}
          onReset={resetFilters}
        />

        <div className="home-page__catalog">
          {loading && (
            <>
              <div className="catalog-state" aria-live="polite">
                Загружаем товары...
              </div>
              <CatalogSkeleton />
            </>
          )}
          {error && !loading && <div className="catalog-state catalog-state--error">{error}</div>}

          {!loading && !error && (
            <>
              <ProductList
                products={productsResponse.results}
                onOpenDetails={(productId) => navigate(`/products/${productId}`)}
                onAddToCart={(product) => addToCart(product)}
                onToggleCompare={toggleCompare}
                isCompared={isCompared}
              />

              <Pagination
                count={productsResponse.count}
                limit={filters.limit}
                offset={filters.offset}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

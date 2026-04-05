import { useEffect, useMemo, useRef, useState } from 'react';

export default function FilterPanel({ filters, categories, onChange, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categorySelectRef = useRef(null);

  const categoryOptions = useMemo(
    () => [{ value: '', label: 'Все категории' }, ...categories.map((category) => ({ value: category, label: category }))],
    [categories]
  );

  const selectedCategoryLabel = useMemo(() => {
    const selected = categoryOptions.find((option) => option.value === filters.category);
    return selected?.label || 'Все категории';
  }, [categoryOptions, filters.category]);

  useEffect(() => {
    if (!isCategoryOpen) {
      return undefined;
    }

    const onDocumentMouseDown = (event) => {
      if (categorySelectRef.current && !categorySelectRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };

    const onDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
    };
  }, [isCategoryOpen]);

  const handleCategorySelect = (value) => {
    onChange({ category: value });
    setIsCategoryOpen(false);
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
    setIsCategoryOpen(false);
  };

  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <button
          type="button"
          className="filter-panel__toggle"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="filter-panel-body"
        >
          <span>Фильтры</span>
          <span className={`filter-panel__toggle-caret ${isExpanded ? 'is-open' : ''}`} aria-hidden="true">
            ▾
          </span>
        </button>
        <button type="button" onClick={onReset}>
          Сбросить
        </button>
      </div>

      {isExpanded && (
        <div id="filter-panel-body" className="filter-panel__body">
          <div className="filter-panel__field">
            <span className="filter-panel__field-label">Категория</span>

            <div
              ref={categorySelectRef}
              className={`filter-panel__select ${isCategoryOpen ? 'is-open' : ''}`}
            >
              <button
                type="button"
                className="filter-panel__select-trigger"
                onClick={() => setIsCategoryOpen((previous) => !previous)}
                aria-haspopup="listbox"
                aria-expanded={isCategoryOpen}
              >
                <span>{selectedCategoryLabel}</span>
                <span className="filter-panel__select-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isCategoryOpen && (
                <ul className="filter-panel__select-menu" role="listbox" aria-label="Категория">
                  {categoryOptions.map((option) => (
                    <li key={option.value || 'all'} role="option" aria-selected={filters.category === option.value}>
                      <button
                        type="button"
                        className={filters.category === option.value ? 'is-active' : ''}
                        onClick={() => handleCategorySelect(option.value)}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <label>
            Цена от
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(event) => onChange({ minPrice: event.target.value })}
              placeholder="0"
            />
          </label>

          <label>
            Цена до
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(event) => onChange({ maxPrice: event.target.value })}
              placeholder="100000"
            />
          </label>

          <label>
            Сортировка
            <select
              value={filters.ordering}
              onChange={(event) => onChange({ ordering: event.target.value })}
            >
              <option value="name">Название А-Я</option>
              <option value="-name">Название Я-А</option>
              <option value="price">Цена по возрастанию</option>
              <option value="-price">Цена по убыванию</option>
            </select>
          </label>
        </div>
      )}
    </aside>
  );
}

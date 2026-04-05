export default function FilterPanel({ filters, categories, onChange, onReset }) {
  return (
    <aside className="filter-panel">
      <div className="filter-panel__header">
        <h2>Фильтры</h2>
        <button type="button" onClick={onReset}>
          Сбросить
        </button>
      </div>

      <label>
        Категория
        <select
          value={filters.category}
          onChange={(event) => onChange({ category: event.target.value })}
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

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
    </aside>
  );
}

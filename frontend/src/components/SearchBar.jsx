import { useMemo, useState } from 'react';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  suggestions,
  onSelectSuggestion,
  loading
}) {
  const [isFocused, setIsFocused] = useState(false);

  const showSuggestions = useMemo(
    () => isFocused && value.trim().length > 0,
    [isFocused, value]
  );

  return (
    <div className="search-bar">
      <label htmlFor="product-search" className="search-bar__label">
        Поиск по каталогу
      </label>
      <div className="search-bar__input-wrap">
        <input
          id="product-search"
          type="text"
          value={value}
          placeholder="Например: смартфон, ноутбук, книга"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 140)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSubmit(value);
            }
          }}
          autoComplete="off"
        />
        <button type="button" onClick={() => onSubmit(value)}>
          Найти
        </button>
      </div>

      {showSuggestions && (
        <ul className="search-bar__suggestions">
          {loading && <li className="search-bar__hint">Ищем подсказки...</li>}

          {!loading &&
            suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelectSuggestion(item.name)}
                >
                  {item.name}
                </button>
              </li>
            ))}

          {!loading && suggestions.length === 0 && (
            <li className="search-bar__hint">Ничего не найдено</li>
          )}
        </ul>
      )}
    </div>
  );
}

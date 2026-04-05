import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useCompare } from '../context/CompareContext';
import { fetchProduct } from '../services/api';
import { formatPrice } from '../utils/helpers';

export default function ComparePage() {
  const { selectedIds, clearCompare, toggleCompare } = useCompare();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setProducts([]);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all(selectedIds.map((id) => fetchProduct(id).catch(() => null)))
      .then((result) => {
        if (active) {
          const valid = result.filter(Boolean);
          setProducts(valid);

          const missingCount = result.length - valid.length;
          if (missingCount > 0) {
            toast.info(`Некоторые товары больше недоступны (${missingCount}).`);
          }
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Не удалось загрузить данные для сравнения.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedIds]);

  return (
    <section className="compare-page">
      <nav className="compare-page__nav">
        <Link to="/">← Назад в каталог</Link>
      </nav>

      <header className="compare-page__header">
        <h1>Сравнение товаров</h1>
        <div>
          <button type="button" onClick={clearCompare} disabled={selectedIds.length === 0}>
            Очистить сравнение
          </button>
        </div>
      </header>

      {loading && <p className="compare-page__state">Загружаем выбранные товары...</p>}

      {!loading && selectedIds.length === 0 && (
        <p className="compare-page__state">Выберите товары в каталоге, чтобы сравнить их параметры.</p>
      )}

      {!loading && products.length > 0 && (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Параметр</th>
                {products.map((product) => (
                  <th key={product.id}>
                    <div className="compare-table__heading">
                      <span>{product.name}</span>
                      <button type="button" onClick={() => toggleCompare(product.id)}>
                        Убрать
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Изображение</td>
                {products.map((product) => (
                  <td key={`img-${product.id}`}>
                    <img
                      src={product.image || 'https://placehold.co/240x160/f8f3ea/473f2f?text=No+Image'}
                      alt={product.name}
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td>Цена</td>
                {products.map((product) => (
                  <td key={`price-${product.id}`}>{formatPrice(product.price)}</td>
                ))}
              </tr>
              <tr>
                <td>Категория</td>
                {products.map((product) => (
                  <td key={`cat-${product.id}`}>{product.category}</td>
                ))}
              </tr>
              <tr>
                <td>Описание</td>
                {products.map((product) => (
                  <td key={`desc-${product.id}`}>{product.description || '—'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

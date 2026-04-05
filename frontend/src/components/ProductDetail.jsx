import { formatPrice } from '../utils/helpers';

export default function ProductDetail({
  product,
  loading,
  error,
  onAddToCart,
  onToggleCompare,
  isCompared
}) {
  if (loading) {
    return <section className="product-detail product-detail--state">Загрузка товара...</section>;
  }

  if (error) {
    return <section className="product-detail product-detail--state">{error}</section>;
  }

  if (!product) {
    return <section className="product-detail product-detail--state">Товар не найден.</section>;
  }

  return (
    <section className="product-detail">
      <div className="product-detail__media">
        <img
          src={product.image || 'https://placehold.co/900x650/f8f3ea/473f2f?text=No+Image'}
          alt={product.name}
        />
      </div>

      <div className="product-detail__content">
        <p className="product-detail__category">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="product-detail__price">{formatPrice(product.price)}</p>

        <div className="product-detail__description">
          <h2>Описание</h2>
          <p>{product.description || 'Описание отсутствует.'}</p>
        </div>

        <div className="product-detail__specs">
          <h2>Характеристики</h2>
          <dl>
            <div>
              <dt>ID</dt>
              <dd>{product.id}</dd>
            </div>
            <div>
              <dt>Категория</dt>
              <dd>{product.category}</dd>
            </div>
            <div>
              <dt>Цена</dt>
              <dd>{formatPrice(product.price)}</dd>
            </div>
          </dl>
        </div>

        <div className="product-detail__actions">
          <button type="button" onClick={() => onAddToCart(product)}>
            Добавить в корзину
          </button>

          <button
            type="button"
            className={isCompared ? 'is-compared' : ''}
            onClick={() => onToggleCompare(product.id)}
          >
            {isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению'}
          </button>
        </div>
      </div>
    </section>
  );
}

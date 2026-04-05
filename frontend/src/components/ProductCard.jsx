import { useDraggable } from '@dnd-kit/core';

import { formatPrice } from '../utils/helpers';

export default function ProductCard({
  product,
  onAddToCart,
  onOpenDetails,
  onToggleCompare,
  isCompared
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `product-${product.id}`,
    data: {
      type: 'product',
      product
    }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`product-card ${isDragging ? 'product-card--dragging' : ''}`}
    >
      <button
        type="button"
        className="product-card__drag-handle"
        title="Перетащить в корзину"
        {...listeners}
        {...attributes}
      >
        Перетащить
      </button>

      <button type="button" className="product-card__image-wrap" onClick={() => onOpenDetails(product.id)}>
        <img
          src={product.image || 'https://placehold.co/600x400/f8f3ea/473f2f?text=No+Image'}
          alt={product.name}
          loading="lazy"
        />
      </button>

      <div className="product-card__content">
        <h3>{product.name}</h3>
        <p>{formatPrice(product.price)}</p>
        <small>{product.category}</small>
      </div>

      <div className="product-card__actions">
        <button type="button" onClick={() => onAddToCart(product)}>
          В корзину
        </button>

        <button
          type="button"
          className={isCompared ? 'is-compared' : ''}
          onClick={() => onToggleCompare(product.id)}
        >
          {isCompared ? 'Убрать из сравнения' : 'Сравнить'}
        </button>
      </div>
    </article>
  );
}

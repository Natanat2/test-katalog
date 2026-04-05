import { useDraggable } from '@dnd-kit/core';

import { applyProductImageFallback, formatPrice, resolveProductImage } from '../utils/helpers';

export default function ProductCard({
  product,
  onAddToCart,
  onOpenDetails,
  onToggleCompare,
  isCompared
}) {
  const compareLabel = isCompared ? 'Убрать из сравнения' : 'Сравнить';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `product-${product.id}`,
    data: {
      type: 'product',
      product
    }
  });

  return (
    <article
      ref={setNodeRef}
      className={`product-card ${isDragging ? 'product-card--dragging' : ''}`}
      {...listeners}
      {...attributes}
      aria-label={`Товар ${product.name}`}
    >
      <button type="button" className="product-card__image-wrap" onClick={() => onOpenDetails(product.id)}>
        <img
          src={resolveProductImage(product.image)}
          alt={product.name}
          loading="lazy"
          onError={applyProductImageFallback}
        />
      </button>

      <div className="product-card__content">
        <h3>{product.name}</h3>
        <p>{formatPrice(product.price)}</p>
        <small>{product.category}</small>
      </div>

      <div className="product-card__actions">
        <button
          type="button"
          className="product-card__action product-card__action--cart"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onAddToCart(product)}
        >
          В корзину
        </button>

        <button
          type="button"
          className={`product-card__action product-card__action--compare ${isCompared ? 'is-compared' : ''}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onToggleCompare(product.id)}
          aria-label={compareLabel}
          data-tooltip={compareLabel}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 4v16h16" />
            <path d="M8 17v-5" />
            <path d="M12 17V8" />
            <path d="M16 17v-7" />
            <path d="M20 17V6" />
          </svg>
        </button>
      </div>
    </article>
  );
}

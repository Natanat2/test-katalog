import { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

import ProductCard from './ProductCard';

function getColumnCount(width) {
  if (width >= 1280) {
    return 4;
  }
  if (width >= 940) {
    return 3;
  }
  if (width >= 620) {
    return 2;
  }
  return 1;
}

export default function ProductList({
  products,
  onAddToCart,
  onOpenDetails,
  onToggleCompare,
  isCompared
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(480);

  useEffect(() => {
    const updateHeight = () => {
      setHeight(Math.max(360, Math.min(760, window.innerHeight - 260)));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect?.width || 0;
      setWidth(nextWidth);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columnCount = useMemo(() => getColumnCount(width), [width]);
  const rowCount = useMemo(() => Math.ceil(products.length / columnCount), [products.length, columnCount]);
  const rowHeight = columnCount === 1 ? 430 : 410;

  const Row = ({ index, style }) => {
    const start = index * columnCount;
    const rowProducts = products.slice(start, start + columnCount);

    return (
      <div
        className="product-list__row"
        style={{
          ...style,
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
        }}
      >
        {rowProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onOpenDetails={onOpenDetails}
            onToggleCompare={onToggleCompare}
            isCompared={isCompared(product.id)}
          />
        ))}
      </div>
    );
  };

  if (products.length === 0) {
    return <div className="product-list__empty">По выбранным фильтрам товары не найдены.</div>;
  }

  return (
    <section className="product-list" ref={containerRef}>
      {width > 0 && (
        <List
          className="product-list__virtual"
          width={width}
          height={height}
          itemCount={rowCount}
          itemSize={rowHeight}
        >
          {Row}
        </List>
      )}
    </section>
  );
}

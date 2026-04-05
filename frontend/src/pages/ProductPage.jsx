import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import ProductDetail from '../components/ProductDetail';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { fetchProduct } from '../services/api';

export default function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);

  const { addToCart } = useCart();
  const { toggleCompare, isCompared } = useCompare();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    fetchProduct(productId)
      .then((result) => {
        if (active) {
          setProduct(result);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Не удалось загрузить товар.');
          toast.error(requestError.message || 'Не удалось загрузить товар.');
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
  }, [productId]);

  return (
    <section className="product-page">
      <nav className="product-page__nav">
        <Link to="/">← Назад в каталог</Link>
      </nav>

      <ProductDetail
        product={product}
        loading={loading}
        error={error}
        onAddToCart={(item) => addToCart(item)}
        onToggleCompare={toggleCompare}
        isCompared={isCompared(product?.id)}
      />
    </section>
  );
}

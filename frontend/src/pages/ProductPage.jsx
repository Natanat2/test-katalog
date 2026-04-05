import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import ProductDetail from '../components/ProductDetail';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useSsrData } from '../context/SsrDataContext';
import { fetchProduct } from '../services/api';
import { applySeoToDocument } from '../utils/seo';

export default function ProductPage() {
  const { id } = useParams();
  const productId = Number(id);

  const { addToCart } = useCart();
  const { toggleCompare, isCompared } = useCompare();
  const { getProductById } = useSsrData();

  const ssrProduct = getProductById(productId);

  const [product, setProduct] = useState(ssrProduct);
  const [loading, setLoading] = useState(!ssrProduct);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ssrProduct) {
      setProduct(ssrProduct);
      setLoading(false);
      setError('');
      return undefined;
    }

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
  }, [productId, ssrProduct]);

  useEffect(() => {
    if (!product || !product.id) {
      return;
    }

    applySeoToDocument(`/products/${product.id}`, undefined, {
      currentProduct: product
    });
  }, [product]);

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

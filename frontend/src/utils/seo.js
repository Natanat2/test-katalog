const DEFAULT_SEO = {
  title: 'Test Katalog - интерактивный каталог товаров',
  description:
    'Интерактивный каталог товаров: поиск, фильтры, сравнение и корзина с быстрым добавлением.',
  keywords: 'каталог товаров, корзина, сравнение товаров, поиск товаров, Астана, Казахстан'
};

function normalizePath(pathOrUrl) {
  if (typeof pathOrUrl !== 'string' || pathOrUrl.length === 0) {
    return '/';
  }

  try {
    const parsed = new URL(pathOrUrl, 'http://localhost');
    return parsed.pathname || '/';
  } catch {
    return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  }
}

function productMetaFromData(product) {
  if (!product || typeof product !== 'object' || typeof product.id !== 'number') {
    return null;
  }

  const productName = typeof product.name === 'string' && product.name.trim() ? product.name.trim() : `Товар #${product.id}`;
  const productDescription =
    typeof product.description === 'string' && product.description.trim()
      ? product.description.trim().slice(0, 190)
      : 'Подробная карточка товара: описание, характеристики, цена и добавление в корзину.';

  return {
    title: `${productName} - Test Katalog`,
    description: productDescription,
    keywords: `карточка товара, ${productName}, цена товара, каталог`
  };
}

export function getSeoMeta(pathOrUrl, options = {}) {
  const pathname = normalizePath(pathOrUrl);

  if (/^\/compare\/?$/.test(pathname)) {
    return {
      title: 'Сравнение товаров - Test Katalog',
      description:
        'Сравнивайте товары по цене, категории и описанию в удобной таблице.',
      keywords: 'сравнение товаров, таблица сравнения, каталог'
    };
  }

  const productMatch = pathname.match(/^\/products\/(\d+)\/?$/);
  if (productMatch) {
    const productId = Number(productMatch[1]);
    const currentProduct = options.currentProduct;
    if (currentProduct && Number(currentProduct.id) === productId) {
      const detailedProductMeta = productMetaFromData(currentProduct);
      if (detailedProductMeta) {
        return detailedProductMeta;
      }
    }

    return {
      title: `Товар #${productMatch[1]} - Test Katalog`,
      description:
        'Подробная карточка товара: описание, характеристики, цена и добавление в корзину.',
      keywords: 'карточка товара, описание товара, цена товара, каталог'
    };
  }

  if (/^\/$/.test(pathname)) {
    return {
      title: 'Каталог товаров - Test Katalog',
      description:
        'Онлайн-каталог с фильтрами, поиском и сортировкой. Добавляйте товары в корзину и сравнивайте их.',
      keywords: 'каталог, фильтры, поиск, сортировка, корзина, сравнение'
    };
  }

  return DEFAULT_SEO;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildSeoHead(pathOrUrl, baseUrl = 'http://localhost:5173', options = {}) {
  const pathname = normalizePath(pathOrUrl);
  const seo = getSeoMeta(pathname, options);
  const canonical = new URL(pathname, baseUrl).toString();

  return `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="ru_KZ" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
  `.trim();
}

function upsertMetaTag(attrName, attrValue, content) {
  const selector = `meta[${attrName}="${attrValue}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonicalLink(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function applySeoToDocument(pathOrUrl, baseUrl, options = {}) {
  if (typeof document === 'undefined') {
    return;
  }

  const resolvedBaseUrl = baseUrl || window.location.origin;
  const pathname = normalizePath(pathOrUrl);
  const seo = getSeoMeta(pathname, options);
  const canonical = new URL(pathname, resolvedBaseUrl).toString();

  document.title = seo.title;
  upsertMetaTag('name', 'description', seo.description);
  upsertMetaTag('name', 'keywords', seo.keywords);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:title', seo.title);
  upsertMetaTag('property', 'og:description', seo.description);
  upsertMetaTag('property', 'og:url', canonical);
  upsertMetaTag('property', 'og:locale', 'ru_KZ');
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', seo.title);
  upsertMetaTag('name', 'twitter:description', seo.description);
  upsertCanonicalLink(canonical);
}

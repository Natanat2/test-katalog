export default function CatalogSkeleton() {
  return (
    <div className="catalog-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <article key={index} className="catalog-skeleton__card">
          <div className="catalog-skeleton__line catalog-skeleton__line--image" />
          <div className="catalog-skeleton__line catalog-skeleton__line--title" />
          <div className="catalog-skeleton__line catalog-skeleton__line--price" />
          <div className="catalog-skeleton__line catalog-skeleton__line--button" />
        </article>
      ))}
    </div>
  );
}

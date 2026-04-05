function buildPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('...');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push('...');
  }

  pages.push(totalPages);
  return pages;
}

export default function Pagination({ count, limit, offset, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const pages = buildPages(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Пагинация каталога">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(offset - limit)}
      >
        Назад
      </button>

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="pagination__dots">
              ...
            </span>
          );
        }

        return (
          <button
            type="button"
            key={page}
            className={page === currentPage ? 'is-active' : ''}
            onClick={() => onPageChange((page - 1) * limit)}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(offset + limit)}
      >
        Вперед
      </button>
    </nav>
  );
}

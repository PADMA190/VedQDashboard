import clsx from 'clsx';
import styles from './Pagination.module.scss';

function buildPages(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) result.push('…');
    result.push(n);
    prev = n;
  }
  return result;
}

export function Pagination({ page, totalPages, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pages = buildPages(safePage, totalPages);

  return (
    <nav aria-label="Pagination" className={clsx(styles.nav, className)}>
      <button
        type="button"
        className={styles.btn}
        disabled={safePage <= 1}
        onClick={() => onChange(safePage - 1)}
      >
        ‹ Prev
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className={styles.gap} aria-hidden>…</span>
        ) : (
          <button
            key={p}
            type="button"
            className={clsx(styles.btn, p === safePage && styles.active)}
            aria-current={p === safePage ? 'page' : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={styles.btn}
        disabled={safePage >= totalPages}
        onClick={() => onChange(safePage + 1)}
      >
        Next ›
      </button>
    </nav>
  );
}

export default Pagination;

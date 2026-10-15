// Previous/Next pager driven by the backend pagination object
// { page, limit, total, pages }.
export default function Pagination({ page, pages, total, onPageChange, disabled = false }) {
  if (!pages || pages <= 1) {
    if (typeof total === "number") {
      return (
        <p className="pagination-summary muted">
          {total} result{total === 1 ? "" : "s"}
        </p>
      );
    }
    return null;
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Previous
      </button>
      <span className="pagination-info">
        Page {page} of {pages}
        {typeof total === "number" ? ` · ${total} total` : ""}
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= pages}
      >
        Next
      </button>
    </nav>
  );
}

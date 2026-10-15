// Shows a backend/API error message (uses error.message when given an Error)
// with an optional retry action.
export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;

  const message =
    typeof error === "string"
      ? error
      : (error && error.message) || "Something went wrong. Please try again.";

  return (
    <div className="error-banner">
      <p className="status-message status-error" role="alert">
        {message}
      </p>
      {onRetry ? (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

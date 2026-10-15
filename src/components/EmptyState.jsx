// Friendly placeholder shown when a list or lookup returns nothing.
export default function EmptyState({ title = "Nothing here yet", message, children }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {message ? <p className="muted">{message}</p> : null}
      {children}
    </div>
  );
}

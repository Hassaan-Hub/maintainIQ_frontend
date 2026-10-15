// Consistent loading indicator with an accessible live region.
export default function Loading({ label = "Loading…", inline = false }) {
  return (
    <div className={inline ? "loading-inline" : "page-loading"} role="status" aria-live="polite">
      {label}
    </div>
  );
}

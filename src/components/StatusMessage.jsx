// Displays a backend or form-level message. `tone` picks the colour.
export default function StatusMessage({ tone = "error", children }) {
  if (!children) return null;
  return (
    <p className={`status-message status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

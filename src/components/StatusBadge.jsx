import { ASSET_STATUS_LABELS, REQUEST_STATUS_LABELS } from "../utils/constants.js";

// Colour-coded pill for asset or request statuses (styled via status-<value>).
export default function StatusBadge({ status, kind = "request" }) {
  const labels = kind === "asset" ? ASSET_STATUS_LABELS : REQUEST_STATUS_LABELS;
  const label = labels[status] || status;
  return <span className={`badge status-${status}`}>{label}</span>;
}

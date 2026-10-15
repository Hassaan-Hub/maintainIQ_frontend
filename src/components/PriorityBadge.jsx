import { PRIORITY_LABELS } from "../utils/constants.js";

// Colour-coded pill for request priority (styled via priority-<value>).
export default function PriorityBadge({ priority }) {
  const label = PRIORITY_LABELS[priority] || priority;
  return <span className={`badge priority-${priority}`}>{label}</span>;
}

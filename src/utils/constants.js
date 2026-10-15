// Shared enums, labels and the status transition map. These mirror the backend
// models/controllers so the UI offers only values the API will accept.

export const ASSET_STATUSES = ["active", "maintenance", "retired"];

export const REQUEST_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
];

export const REQUEST_PRIORITIES = ["low", "medium", "high", "critical"];

export const USER_ROLES = ["user", "technician", "admin"];

// A request is "active" while it still needs work.
export const ACTIVE_STATUSES = ["open", "in_progress"];

// Legal status transitions (same rules as the backend model). "cancelled" is
// terminal and is handled by the dedicated cancel endpoint for reporters.
export const STATUS_TRANSITIONS = {
  open: ["in_progress", "resolved", "closed", "cancelled"],
  in_progress: ["open", "resolved", "closed", "cancelled"],
  resolved: ["in_progress", "closed"],
  closed: ["open"],
  cancelled: [],
};

export const ASSET_STATUS_LABELS = {
  active: "Active",
  maintenance: "Maintenance",
  retired: "Retired",
};

export const REQUEST_STATUS_LABELS = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const ROLE_LABELS = {
  user: "User",
  technician: "Technician",
  admin: "Admin",
};

export const HISTORY_ACTION_LABELS = {
  created: "Created",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  assigned: "Assigned",
  unassigned: "Unassigned",
  updated: "Updated",
  cancelled: "Cancelled",
};

// Next statuses the given user may move a request to from its current status.
// Technicians can never set "cancelled" (they use the cancel endpoint only as
// the reporter, which they are not in this view).
export function nextStatusesFor(from, role) {
  const allowed = STATUS_TRANSITIONS[from] || [];
  if (role === "technician") {
    return allowed.filter((status) => status !== "cancelled");
  }
  return allowed;
}

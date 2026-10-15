// Role helpers shared by the navbar, route guards and post-login redirects.

// Higher number = more privileges.
export const ROLE_ORDER = { user: 0, technician: 1, admin: 2 };

// Where each role lands after logging in (or when visiting "/").
export function getHomePath(role) {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "technician":
      return "/assigned";
    default:
      return "/my-requests";
  }
}

// Navbar links per role. Every link points at a real page; the asset register
// is visible to all roles.
export function navLinksForRole(role) {
  switch (role) {
    case "admin":
      return [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/assets", label: "Assets" },
        { to: "/admin/requests", label: "Requests" },
        { to: "/admin/users", label: "Users" },
      ];
    case "technician":
      return [
        { to: "/assigned", label: "Assigned" },
        { to: "/assets", label: "Assets" },
      ];
    case "user":
      return [
        { to: "/my-requests", label: "My Requests" },
        { to: "/assets", label: "Assets" },
      ];
    default:
      return [];
  }
}

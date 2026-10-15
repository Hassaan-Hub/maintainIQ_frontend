import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Forbidden from "../pages/Forbidden.jsx";

// Requires an authenticated user whose role is in `roles`. Unauthenticated
// users are sent to /login; authenticated users with the wrong role see the
// 403 page.
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Forbidden />;
  }

  return children;
}

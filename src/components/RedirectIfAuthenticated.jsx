import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getHomePath } from "../utils/roles.js";

// Wraps /login and /register: an already logged-in user is sent straight to
// their home page instead of seeing the auth forms again.
export default function RedirectIfAuthenticated({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return children;
}

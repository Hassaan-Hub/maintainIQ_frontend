import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getHomePath } from "../utils/roles.js";

// Shown when a logged-in user reaches a route their role cannot use.
export default function Forbidden() {
  const { user } = useAuth();
  const home = user ? getHomePath(user.role) : "/login";

  return (
    <div className="message-page">
      <div className="card message-card">
        <p className="error-code">403</p>
        <h1>Access denied</h1>
        <p className="muted">
          You do not have permission to view this page
          {user ? ` as a ${user.role}` : ""}.
        </p>
        <Link to={home} className="btn btn-primary">
          Go to my home page
        </Link>
      </div>
    </div>
  );
}

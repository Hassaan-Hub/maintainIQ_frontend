import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getHomePath } from "../utils/roles.js";

export default function NotFound() {
  const { user } = useAuth();
  const home = user ? getHomePath(user.role) : "/login";

  return (
    <div className="message-page">
      <div className="card message-card">
        <p className="error-code">404</p>
        <h1>Page not found</h1>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link to={home} className="btn btn-primary">
          Back to safety
        </Link>
      </div>
    </div>
  );
}

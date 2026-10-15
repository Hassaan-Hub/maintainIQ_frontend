import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { navLinksForRole } from "../utils/roles.js";

// Authenticated shell: navbar (role-based links + logout) around the page.
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const links = navLinksForRole(user ? user.role : null);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            MaintainIQ
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar-user">
            {user ? (
              <span className="user-chip">
                {user.username}
                <span className="role-badge">{user.role}</span>
              </span>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleLogout}
              disabled={signingOut}
            >
              {signingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}

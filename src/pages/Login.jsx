import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getHomePath } from "../utils/roles.js";
import { validateLoginForm, compactErrors } from "../utils/validation.js";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const flashMessage = location.state && location.state.message;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const errors = compactErrors(validateLoginForm({ email, password }));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const loggedIn = await login(email, password);
      // Return to the page the user originally wanted (e.g. a scanned asset or
      // the report form) when the router redirected them here.
      const from = location.state && location.state.from;
      if (from && from.pathname) {
        navigate(`${from.pathname}${from.search || ""}`, { replace: true });
        return;
      }
      navigate(getHomePath(loggedIn.role), { replace: true });
    } catch (error) {
      // Includes the backend 429 "Too many attempts. Please try again later."
      setFormError(error.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="muted">Welcome back to MaintainIQ.</p>

        <StatusMessage tone="success">{flashMessage}</StatusMessage>
        <StatusMessage tone="error">{formError}</StatusMessage>

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-alt">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { validateRegisterForm, compactErrors } from "../utils/validation.js";
import FormField from "../components/FormField.jsx";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const errors = compactErrors(validateRegisterForm({ username, email, password }));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await register(username, email, password);
      // Registration does not log the user in, so send them to the login page.
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Please sign in." },
      });
    } catch (error) {
      // Includes the backend 429 "Too many attempts. Please try again later."
      setFormError(error.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="muted">Report and track maintenance issues.</p>

        <StatusMessage tone="error">{formError}</StatusMessage>

        <form onSubmit={handleSubmit} noValidate>
          <FormField
            id="username"
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={fieldErrors.username}
            autoComplete="username"
            placeholder="3–30 characters"
          />
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
            autoComplete="new-password"
            placeholder="8–72 characters"
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="auth-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

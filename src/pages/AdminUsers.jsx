import { useState } from "react";
import { usersApi } from "../api/users.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { USER_ROLES, ROLE_LABELS } from "../utils/constants.js";
import {
  validateUserForm,
  compactErrors,
} from "../utils/validation.js";
import { formatDate } from "../utils/format.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import FormField from "../components/FormField.jsx";

const EMPTY_USER = { username: "", email: "", password: "", role: "user" };

function UserRow({ user, currentUserId, onRoleChange }) {
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const isSelf = user.id === currentUserId;

  async function apply() {
    setBusy(true);
    try {
      await onRoleChange(user.id, role);
    } catch {
      // The parent shows the backend message; reset the draft to the saved role.
      setRole(user.role);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>
        {user.username}
        {isSelf ? <span className="muted small"> (you)</span> : null}
      </td>
      <td>{user.email}</td>
      <td>{ROLE_LABELS[user.role] || user.role}</td>
      <td>{formatDate(user.createdAt)}</td>
      <td className="align-right">
        {isSelf ? (
          <span className="muted small">Cannot change your own role</span>
        ) : (
          <div className="row-actions">
            <select
              className="input input-sm"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-label={`Role for ${user.username}`}
            >
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={apply}
              disabled={busy || role === user.role}
            >
              {busy ? "Saving…" : "Apply"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// Admin user management: list/filter, create accounts of any role, and change
// roles (never your own).
export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [form, setForm] = useState(EMPTY_USER);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () => usersApi.list(filters),
    [filters]
  );

  const users = data ? data.users : [];
  const pagination = data ? data.pagination : { page: 1, total: 0, pages: 1 };

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setCreateError(null);
    setCreateSuccess("");

    const errors = compactErrors(validateUserForm(form));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await usersApi.create({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setForm(EMPTY_USER);
      setShowCreate(false);
      setCreateSuccess("User created successfully.");
      reload();
    } catch (err) {
      setCreateError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(id, role) {
    setActionError(null);
    try {
      await usersApi.updateRole(id, role);
      reload();
    } catch (err) {
      setActionError(err);
      throw err;
    }
  }

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <h1>Users</h1>
          <p className="muted">Create accounts and manage roles.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? "Close" : "New user"}
        </button>
      </div>

      {createSuccess ? (
        <p className="status-message status-success" role="status">
          {createSuccess}
        </p>
      ) : null}

      {showCreate ? (
        <form className="card form" onSubmit={handleCreate} noValidate>
          <h2>Create user</h2>
          <ErrorBanner error={createError} />
          <div className="filters-grid">
            <FormField
              id="new-username"
              label="Username"
              value={form.username}
              onChange={update("username")}
              error={fieldErrors.username}
              maxLength={30}
              required
            />
            <FormField
              id="new-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={update("email")}
              error={fieldErrors.email}
              autoComplete="off"
              required
            />
          </div>
          <div className="filters-grid">
            <FormField
              id="new-password"
              label="Password"
              type="password"
              value={form.password}
              onChange={update("password")}
              error={fieldErrors.password}
              autoComplete="new-password"
              hint="8–72 characters."
              required
            />
            <FormField
              id="new-role"
              label="Role"
              as="select"
              value={form.role}
              onChange={update("role")}
              error={fieldErrors.role}
            >
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </FormField>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="filters card">
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="user-search">Search</label>
            <input
              id="user-search"
              className="input"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setFilters((prev) => ({
                    ...prev,
                    page: 1,
                    search: searchInput.trim() || undefined,
                  }));
                }
              }}
              placeholder="Username or email"
            />
          </div>
          <div className="field">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              className="input"
              value={filters.role || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  role: event.target.value || undefined,
                }))
              }
            >
              <option value="">All roles</option>
              {USER_ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: 1,
                search: searchInput.trim() || undefined,
              }))
            }
          >
            Search
          </button>
        </div>
      </div>

      <ErrorBanner error={actionError || error} onRetry={reload} />

      {loading ? (
        <Loading label="Loading users…" />
      ) : (
        <>
          {users.length === 0 && !error ? (
            <EmptyState title="No users found" message="Try a different filter." />
          ) : null}

          {users.length > 0 ? (
            <div className="table-wrap card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th className="align-right">Change role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <UserRow
                      key={row.id}
                      user={row}
                      currentUserId={currentUser ? currentUser.id : null}
                      onRoleChange={handleRoleChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            disabled={loading}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </section>
  );
}

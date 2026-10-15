import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { requestsApi } from "../api/requests.js";
import { usersApi } from "../api/users.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import {
  nextStatusesFor,
  REQUEST_PRIORITIES,
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  HISTORY_ACTION_LABELS,
} from "../utils/constants.js";
import { formatDate, formatDateTime, toDateInputValue } from "../utils/format.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FormField from "../components/FormField.jsx";

// A small modal form wrapper: runs `onSubmit`, closes on success, shows the
// backend message on failure (so 400/403/404 reasons are visible).
function ActionModal({ title, onClose, onSubmit, submitLabel, children }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <ErrorBanner error={error} />
        {children}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Working…" : submitLabel}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StatusModal({ request, role, onClose, onSubmit }) {
  const options = nextStatusesFor(request.status, role);
  const [status, setStatus] = useState(options[0] || "");
  const [note, setNote] = useState("");

  return (
    <ActionModal
      title="Change status"
      onClose={onClose}
      submitLabel="Update status"
      onSubmit={() => onSubmit(status, note)}
    >
      <FormField
        id="new-status"
        label="New status"
        as="select"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {REQUEST_STATUS_LABELS[option]}
          </option>
        ))}
      </FormField>
      <FormField
        id="status-note"
        label="Note"
        as="textarea"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
      />
    </ActionModal>
  );
}

function CancelModal({ onClose, onSubmit }) {
  const [note, setNote] = useState("");
  return (
    <ActionModal
      title="Cancel request"
      onClose={onClose}
      submitLabel="Cancel request"
      onSubmit={() => onSubmit(note)}
    >
      <p className="muted small">Cancelling is permanent and cannot be undone.</p>
      <FormField
        id="cancel-note"
        label="Reason (optional)"
        as="textarea"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
      />
    </ActionModal>
  );
}

function AssignModal({ request, onClose, onSubmit }) {
  const { data, loading, error } = useAsyncData(
    () => usersApi.list({ role: "technician", limit: 100 }),
    []
  );
  const technicians = data ? data.users : [];
  const currentId = request.assignedTechnician ? request.assignedTechnician.id : "";
  const [technicianId, setTechnicianId] = useState(currentId);

  return (
    <ActionModal
      title="Assign technician"
      onClose={onClose}
      submitLabel="Save assignment"
      onSubmit={() => onSubmit(technicianId)}
    >
      <ErrorBanner error={error} />
      {loading ? (
        <Loading inline label="Loading technicians…" />
      ) : (
        <FormField
          id="technician"
          label="Technician"
          as="select"
          value={technicianId}
          onChange={(event) => setTechnicianId(event.target.value)}
        >
          <option value="">Unassigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.username}
            </option>
          ))}
        </FormField>
      )}
      {technicians.length === 0 && !loading ? (
        <p className="muted small">
          No technician accounts exist yet. Create one from the Users page.
        </p>
      ) : null}
    </ActionModal>
  );
}

function EditModal({ request, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: request.title,
    description: request.description,
    category: request.category || "",
    location: request.location || "",
    dueDate: toDateInputValue(request.dueDate),
    priority: request.priority,
  });
  const [error, setError] = useState(null);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError({ message: "Title and description are required." });
      return;
    }
    if (!form.category.trim() || !form.location.trim()) {
      setError({ message: "Category and location cannot be empty." });
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      location: form.location.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null,
    };
    return onSubmit(payload).then(onClose).catch(setError);
  }

  return (
    <Modal title="Edit request" onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        <ErrorBanner error={error} />
        <FormField
          id="edit-title"
          label="Title"
          value={form.title}
          onChange={update("title")}
          maxLength={120}
          required
        />
        <FormField
          id="edit-description"
          label="Description"
          as="textarea"
          rows={4}
          value={form.description}
          onChange={update("description")}
          maxLength={2000}
          required
        />
        <div className="filters-grid">
          <FormField
            id="edit-category"
            label="Category"
            value={form.category}
            onChange={update("category")}
            maxLength={80}
            required
          />
          <FormField
            id="edit-location"
            label="Location"
            value={form.location}
            onChange={update("location")}
            maxLength={120}
            required
          />
        </div>
        <FormField
          id="edit-priority"
          label="Priority"
          as="select"
          value={form.priority}
          onChange={update("priority")}
        >
          {REQUEST_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </FormField>
        <FormField
          id="edit-due"
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={update("dueDate")}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function HistoryEntry({ entry }) {
  const label = HISTORY_ACTION_LABELS[entry.action] || entry.action;
  let detail = "";
  if (entry.action === "status_changed" || entry.action === "cancelled") {
    detail = `${REQUEST_STATUS_LABELS[entry.from] || entry.from || "—"} → ${
      REQUEST_STATUS_LABELS[entry.to] || entry.to || "—"
    }`;
  } else if (entry.action === "priority_changed") {
    detail = `${PRIORITY_LABELS[entry.from] || entry.from || "—"} → ${
      PRIORITY_LABELS[entry.to] || entry.to || "—"
    }`;
  } else if (entry.action === "updated") {
    detail = entry.note ? `Fields: ${entry.note}` : "";
  }

  return (
    <li className="timeline-item">
      <div className="timeline-dot" aria-hidden="true" />
      <div className="timeline-content">
        <p className="timeline-title">
          {label} {detail ? <span className="muted">· {detail}</span> : null}
        </p>
        {entry.note && entry.action !== "updated" ? (
          <p className="muted small">“{entry.note}”</p>
        ) : null}
        <p className="muted small">
          {entry.by ? entry.by.username : "System"} · {formatDateTime(entry.at)}
        </p>
      </div>
    </li>
  );
}

// Full request view with the action set the current role is allowed to use.
export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modal, setModal] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(false);

  const { data, loading, error, reload } = useAsyncData(
    () => Promise.all([requestsApi.get(id), requestsApi.history(id)]),
    [id]
  );

  const request = data ? data[0].request : null;
  const history = data ? data[1].history : [];

  if (error && error.status === 404) {
    return (
      <section className="message-page-inline">
        <div className="card message-card">
          <p className="error-code">404</p>
          <h1>Request not found</h1>
          <p className="muted">
            This request does not exist or you do not have access to it.
          </p>
          <Link to="/my-requests" className="btn btn-primary">
            Back to my requests
          </Link>
        </div>
      </section>
    );
  }

  const isAdmin = user && user.role === "admin";
  const isOwner =
    request && request.reportedBy && user && request.reportedBy.id === user.id;
  const isAssigned =
    request &&
    request.assignedTechnician &&
    user &&
    request.assignedTechnician.id === user.id;

  const canCancel =
    request &&
    (isOwner || isAdmin) &&
    ["open", "in_progress"].includes(request.status);
  const canChangeStatus =
    request &&
    (isAdmin || (user && user.role === "technician" && isAssigned)) &&
    nextStatusesFor(request.status, user ? user.role : null).length > 0;
  const canAssign =
    request && isAdmin && ["open", "in_progress", "resolved"].includes(request.status);
  const canEdit = Boolean(isAdmin);
  const canDelete = Boolean(isAdmin);

  async function run(action) {
    await action();
    reload();
  }

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <p className="asset-kicker">Maintenance request</p>
          <h1>{request ? request.title : "Request"}</h1>
        </div>
        <Link to="/my-requests" className="btn btn-ghost">
          Back
        </Link>
      </div>

      <ErrorBanner error={error && error.status !== 404 ? error : null} onRetry={reload} />

      {loading ? <Loading label="Loading request…" /> : null}

      {request ? (
        <div className="detail-grid">
          <article className="card">
            <div className="row-between wrap">
              <div className="badge-row">
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <div className="detail-actions">
                {canChangeStatus ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setModal("status")}
                  >
                    Change status
                  </button>
                ) : null}
                {canAssign ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setModal("assign")}
                  >
                    Assign
                  </button>
                ) : null}
                {canEdit ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setModal("edit")}
                  >
                    Edit
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setModal("cancel")}
                  >
                    Cancel request
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setPendingDelete(true)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>

            <p className="request-description">{request.description}</p>

            <dl className="asset-details">
              <div>
                <dt>Asset</dt>
                <dd>
                  {request.asset ? (
                    <Link to={`/asset/${request.asset.id}`}>
                      {request.asset.name} ({request.asset.assetCode})
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Reported by</dt>
                <dd>
                  {request.reportedBy ? request.reportedBy.username : "—"}
                  {request.reportedBy ? (
                    <span className="muted small"> ({request.reportedBy.role})</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>Assigned technician</dt>
                <dd>
                  {request.assignedTechnician ? (
                    request.assignedTechnician.username
                  ) : (
                    <span className="muted">Unassigned</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{request.category || "—"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{request.location || "—"}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>{formatDate(request.dueDate)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(request.createdAt)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDateTime(request.updatedAt)}</dd>
              </div>
            </dl>
          </article>

          <article className="card">
            <h2>History</h2>
            {history.length === 0 ? (
              <p className="muted">No history yet.</p>
            ) : (
              <ol className="timeline">
                {history.map((entry, index) => (
                  <HistoryEntry key={`${entry.at}-${index}`} entry={entry} />
                ))}
              </ol>
            )}
          </article>
        </div>
      ) : null}

      {request && modal === "status" ? (
        <StatusModal
          request={request}
          role={user ? user.role : null}
          onClose={() => setModal(null)}
          onSubmit={(status, note) =>
            run(() => requestsApi.updateStatus(id, note ? { status, note } : { status }))
          }
        />
      ) : null}

      {request && modal === "cancel" ? (
        <CancelModal
          onClose={() => setModal(null)}
          onSubmit={(note) => run(() => requestsApi.cancel(id, note ? { note } : {}))}
        />
      ) : null}

      {request && modal === "assign" ? (
        <AssignModal
          request={request}
          onClose={() => setModal(null)}
          onSubmit={(technicianId) => run(() => requestsApi.assign(id, { technicianId }))}
        />
      ) : null}

      {request && modal === "edit" ? (
        <EditModal
          request={request}
          onClose={() => setModal(null)}
          onSubmit={(payload) => run(() => requestsApi.update(id, payload))}
        />
      ) : null}

      {request && pendingDelete ? (
        <ConfirmDialog
          title="Delete request"
          message="Delete this maintenance request? This cannot be undone."
          confirmLabel="Delete"
          onClose={() => setPendingDelete(false)}
          onConfirm={async () => {
            await requestsApi.remove(id);
            setPendingDelete(false);
            navigate("/admin/requests", { replace: true });
          }}
        />
      ) : null}
    </section>
  );
}

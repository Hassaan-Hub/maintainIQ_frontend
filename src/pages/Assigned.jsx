import { useState } from "react";
import { requestsApi } from "../api/requests.js";
import { usersApi } from "../api/users.js";
import { dashboardApi } from "../api/dashboard.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  REQUEST_PRIORITIES,
  PRIORITY_LABELS,
} from "../utils/constants.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import RequestsTable from "../components/RequestsTable.jsx";

const WORKLOAD_FIELDS = [
  ["open", "Open"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
  ["cancelled", "Cancelled"],
  ["total", "Total"],
];

// Technician (and admin) work queue. Technicians see requests assigned to
// them; admins can filter to a specific technician.
export default function Assigned() {
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";

  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [technicianId, setTechnicianId] = useState("");

  const { data, loading, error, reload } = useAsyncData(
    () => requestsApi.listAssigned({ ...filters, technicianId: technicianId || undefined }),
    [filters, technicianId]
  );

  const { data: techniciansData } = useAsyncData(
    () => (isAdmin ? usersApi.list({ role: "technician", limit: 100 }) : Promise.resolve(null)),
    []
  );
  const technicians = techniciansData ? techniciansData.users : [];

  const workloadEnabled = user && (user.role === "technician" || (isAdmin && technicianId));
  const { data: workload } = useAsyncData(
    () =>
      workloadEnabled
        ? dashboardApi.myWorkload(technicianId ? { technicianId } : {})
        : Promise.resolve(null),
    [workloadEnabled, technicianId]
  );

  const requests = data ? data.requests : [];
  const pagination = data ? data.pagination : { page: 1, total: 0, pages: 1 };

  return (
    <section>
      <div className="page-header">
        <h1>Assigned work</h1>
        <p className="muted">
          {isAdmin ? "All assigned work, filterable by technician." : "Requests assigned to you."}
        </p>
      </div>

      {workload ? (
        <div className="stat-grid">
          {WORKLOAD_FIELDS.map(([key, label]) => (
            <div key={key} className="stat-card">
              <span className="stat-value">{workload[key] ?? 0}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="filters card">
        <div className="filters-grid">
          {isAdmin ? (
            <div className="field">
              <label htmlFor="assigned-tech">Technician</label>
              <select
                id="assigned-tech"
                className="input"
                value={technicianId}
                onChange={(event) => {
                  setTechnicianId(event.target.value);
                  setFilters((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <option value="">All technicians</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.username}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="assigned-status">Status</label>
            <select
              id="assigned-status"
              className="input"
              value={filters.status || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  status: event.target.value || undefined,
                }))
              }
            >
              <option value="">All statuses</option>
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {REQUEST_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assigned-priority">Priority</label>
            <select
              id="assigned-priority"
              className="input"
              value={filters.priority || ""}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  page: 1,
                  priority: event.target.value || undefined,
                }))
              }
            >
              <option value="">All priorities</option>
              {REQUEST_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ErrorBanner error={error} onRetry={reload} />

      {loading ? (
        <Loading label="Loading assigned work…" />
      ) : (
        <>
          {requests.length === 0 && !error ? (
            <EmptyState
              title="No assigned requests"
              message="When work is assigned to you it will appear here."
            />
          ) : null}

          {requests.length > 0 ? (
            <RequestsTable requests={requests} showReporter showTechnician={false} />
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

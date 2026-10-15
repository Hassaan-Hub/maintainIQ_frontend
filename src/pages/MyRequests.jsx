import { useState } from "react";
import { Link } from "react-router-dom";
import { requestsApi } from "../api/requests.js";
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

// Requests reported by the current user (GET /maintenance-requests/my).
export default function MyRequests() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });

  const { data, loading, error, reload } = useAsyncData(
    () => requestsApi.listMy(filters),
    [filters]
  );

  const requests = data ? data.requests : [];
  const pagination = data ? data.pagination : { page: 1, total: 0, pages: 1 };

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <h1>My requests</h1>
          <p className="muted">Issues you have reported.</p>
        </div>
        <Link to="/requests/new" className="btn btn-primary">
          Report an issue
        </Link>
      </div>

      <div className="filters card">
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="my-status">Status</label>
            <select
              id="my-status"
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
            <label htmlFor="my-priority">Priority</label>
            <select
              id="my-priority"
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
        <Loading label="Loading your requests…" />
      ) : (
        <>
          {requests.length === 0 && !error ? (
            <EmptyState
              title="No requests yet"
              message="Report an issue to see it listed here."
            >
              <Link to="/requests/new" className="btn btn-primary">
                Report an issue
              </Link>
            </EmptyState>
          ) : null}

          {requests.length > 0 ? (
            <RequestsTable requests={requests} showReporter={false} showTechnician />
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

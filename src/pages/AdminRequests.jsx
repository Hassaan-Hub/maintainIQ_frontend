import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { requestsApi } from "../api/requests.js";
import { usersApi } from "../api/users.js";
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

// Admin view of every maintenance request with search, filters and paging.
// Initial filters can come from the URL (used by dashboard quick links).
export default function AdminRequests() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    assignedTechnician: searchParams.get("assignedTechnician") || undefined,
    category: searchParams.get("category") || undefined,
    location: searchParams.get("location") || undefined,
    search: searchParams.get("search") || undefined,
  });
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const { data, loading, error, reload } = useAsyncData(
    () => requestsApi.listAll(filters),
    [filters]
  );

  const { data: techniciansData } = useAsyncData(
    () => usersApi.list({ role: "technician", limit: 100 }),
    []
  );
  const technicians = techniciansData ? techniciansData.users : [];

  const requests = data ? data.requests : [];
  const pagination = data ? data.pagination : { page: 1, total: 0, pages: 1 };

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, page: 1, [key]: value || undefined }));
  }

  function applySearch(event) {
    event.preventDefault();
    setFilter("search", searchInput.trim());
  }

  return (
    <section>
      <div className="page-header">
        <h1>All requests</h1>
        <p className="muted">Search, triage and assign maintenance work.</p>
      </div>

      <form className="filters card" onSubmit={applySearch}>
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="admin-search">Search</label>
            <input
              id="admin-search"
              className="input"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title, description, category, location"
            />
          </div>
          <div className="field">
            <label htmlFor="admin-status">Status</label>
            <select
              id="admin-status"
              className="input"
              value={filters.status || ""}
              onChange={(event) => setFilter("status", event.target.value)}
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
            <label htmlFor="admin-priority">Priority</label>
            <select
              id="admin-priority"
              className="input"
              value={filters.priority || ""}
              onChange={(event) => setFilter("priority", event.target.value)}
            >
              <option value="">All priorities</option>
              {REQUEST_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-tech">Technician</label>
            <select
              id="admin-tech"
              className="input"
              value={filters.assignedTechnician || ""}
              onChange={(event) => setFilter("assignedTechnician", event.target.value)}
            >
              <option value="">All technicians</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.username}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-category">Category</label>
            <input
              id="admin-category"
              className="input"
              value={filters.category || ""}
              onChange={(event) => setFilter("category", event.target.value)}
              placeholder="Exact category"
            />
          </div>
          <div className="field">
            <label htmlFor="admin-location">Location</label>
            <input
              id="admin-location"
              className="input"
              value={filters.location || ""}
              onChange={(event) => setFilter("location", event.target.value)}
              placeholder="Exact location"
            />
          </div>
        </div>
        <div className="filters-actions">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearchInput("");
              setFilters({ page: 1, limit: 10 });
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <ErrorBanner error={error} onRetry={reload} />

      {loading ? (
        <Loading label="Loading requests…" />
      ) : (
        <>
          {requests.length === 0 && !error ? (
            <EmptyState title="No requests found" message="Try adjusting the filters." />
          ) : null}

          {requests.length > 0 ? (
            <RequestsTable requests={requests} showReporter showTechnician />
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

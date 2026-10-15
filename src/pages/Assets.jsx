import { useState } from "react";
import { Link } from "react-router-dom";
import { assetsApi } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { ASSET_STATUSES, ASSET_STATUS_LABELS } from "../utils/constants.js";
import { formatDate } from "../utils/format.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

// Asset list, available to every logged-in user. Admins also get create,
// edit and delete controls.
export default function Assets() {
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";

  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data, loading, error, reload } = useAsyncData(
    () => assetsApi.list(filters),
    [filters]
  );

  const assets = data ? data.assets : [];
  const pagination = data ? data.pagination : { page: 1, limit: 10, total: 0, pages: 1 };

  function applyFilters(event) {
    event.preventDefault();
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchInput.trim() || undefined,
      category: categoryInput.trim() || undefined,
      location: locationInput.trim() || undefined,
    }));
  }

  function resetFilters() {
    setSearchInput("");
    setCategoryInput("");
    setLocationInput("");
    setFilters({ page: 1, limit: 10 });
  }

  function changeStatus(value) {
    setFilters((prev) => ({ ...prev, page: 1, status: value || undefined }));
  }

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <h1>Assets</h1>
          <p className="muted">Browse the asset register and scan QR labels.</p>
        </div>
        {isAdmin ? (
          <Link to="/admin/assets/new" className="btn btn-primary">
            New asset
          </Link>
        ) : null}
      </div>

      <form className="filters card" onSubmit={applyFilters}>
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="asset-search">Search</label>
            <input
              id="asset-search"
              className="input"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, code, category, location"
            />
          </div>
          <div className="field">
            <label htmlFor="asset-status">Status</label>
            <select
              id="asset-status"
              className="input"
              value={filters.status || ""}
              onChange={(event) => changeStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {ASSET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ASSET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="asset-category">Category</label>
            <input
              id="asset-category"
              className="input"
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              placeholder="Exact category"
            />
          </div>
          <div className="field">
            <label htmlFor="asset-location">Location</label>
            <input
              id="asset-location"
              className="input"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Exact location"
            />
          </div>
        </div>
        <div className="filters-actions">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      <ErrorBanner error={error} onRetry={reload} />

      {loading ? (
        <Loading label="Loading assets…" />
      ) : (
        <>
          {assets.length === 0 && !error ? (
            <EmptyState
              title="No assets found"
              message="Try adjusting the filters or search terms."
            />
          ) : null}

          {assets.length > 0 ? (
            <div className="table-wrap card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <div className="asset-cell">
                          {asset.imageUrl ? (
                            <img
                              className="asset-thumb"
                              src={asset.imageUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="asset-thumb asset-thumb-empty" aria-hidden="true">
                              {asset.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <Link to={`/asset/${asset.id}`}>{asset.name}</Link>
                        </div>
                      </td>
                      <td className="mono">{asset.assetCode}</td>
                      <td>{asset.category}</td>
                      <td>{asset.location}</td>
                      <td>
                        <StatusBadge status={asset.status} kind="asset" />
                      </td>
                      <td>{formatDate(asset.createdAt)}</td>
                      <td className="align-right">
                        <div className="row-actions">
                          <Link to={`/asset/${asset.id}`} className="btn btn-ghost btn-sm">
                            View
                          </Link>
                          {isAdmin ? (
                            <>
                              <Link
                                to={`/admin/assets/${asset.id}/edit`}
                                className="btn btn-ghost btn-sm"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => setPendingDelete(asset)}
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
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

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete asset"
          message={`Delete "${pendingDelete.name}" (${pendingDelete.assetCode})? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await assetsApi.remove(pendingDelete.id);
            setPendingDelete(null);
            reload();
          }}
        />
      ) : null}
    </section>
  );
}

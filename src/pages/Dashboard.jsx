import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  REQUEST_PRIORITIES,
  PRIORITY_LABELS,
} from "../utils/constants.js";
import { formatDate } from "../utils/format.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";

// Plain count table (no charts): one row per enum value in a fixed order.
function CountTable({ title, counts, labels, order }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="align-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {order.map((key) => (
              <tr key={key}>
                <td>{labels[key] || key}</td>
                <td className="align-right">{counts[key] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Admin dashboard: totals, workload and rule-based recommendations.
export default function Dashboard() {
  const { data, loading, error, reload } = useAsyncData(
    () =>
      Promise.all([
        dashboardApi.stats(),
        dashboardApi.technicians(),
        dashboardApi.recommendations(),
      ]),
    []
  );

  const stats = data ? data[0] : null;
  const technicians = data ? data[1].technicians : [];
  const recommendations = data ? data[2] : null;

  if (loading) return <Loading label="Loading dashboard…" />;

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Maintenance overview and planning.</p>
        </div>
        <Link to="/admin/requests" className="btn btn-ghost">
          All requests
        </Link>
      </div>

      <ErrorBanner error={error} onRetry={reload} />

      {stats ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-value">{stats.assets.total}</span>
              <span className="stat-label">Assets</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.requests.total}</span>
              <span className="stat-label">Requests</span>
            </div>
            <div className="stat-card attention">
              <span className="stat-value">{stats.requests.unassigned}</span>
              <span className="stat-label">Unassigned</span>
            </div>
            <div className="stat-card attention">
              <span className="stat-value">{stats.requests.overdue}</span>
              <span className="stat-label">Overdue</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{stats.requests.upcoming}</span>
              <span className="stat-label">Due soon (7d)</span>
            </div>
          </div>

          <CountTable
            title="Assets by status"
            counts={stats.assets.byStatus}
            labels={ASSET_STATUS_LABELS}
            order={ASSET_STATUSES}
          />
          <CountTable
            title="Requests by status"
            counts={stats.requests.byStatus}
            labels={REQUEST_STATUS_LABELS}
            order={REQUEST_STATUSES}
          />
          <CountTable
            title="Requests by priority"
            counts={stats.requests.byPriority}
            labels={PRIORITY_LABELS}
            order={REQUEST_PRIORITIES}
          />
        </>
      ) : null}

      <div className="card">
        <h2>Technician workload</h2>
        {technicians.length === 0 ? (
          <p className="muted">No technician accounts yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Total</th>
                  <th>Open</th>
                  <th>In progress</th>
                  <th>Resolved</th>
                  <th>Closed</th>
                  <th>Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((row) => (
                  <tr key={row.technician.id}>
                    <td>
                      <Link to={`/admin/requests?assignedTechnician=${row.technician.id}`}>
                        {row.technician.username}
                      </Link>
                    </td>
                    <td>{row.total}</td>
                    <td>{row.open}</td>
                    <td>{row.in_progress}</td>
                    <td>{row.resolved}</td>
                    <td>{row.closed}</td>
                    <td>{row.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recommendations ? (
        <>
          <div className="card">
            <h2>Overdue ({recommendations.overdue.count})</h2>
            {recommendations.overdue.requests.length === 0 ? (
              <p className="muted">Nothing overdue.</p>
            ) : (
              <ul className="link-list">
                {recommendations.overdue.requests.map((item) => (
                  <li key={item.id}>
                    <Link to={`/requests/${item.id}`}>{item.title}</Link>
                    <span className="muted small">
                      {item.asset ? ` · ${item.asset.name}` : ""} · due {formatDate(item.dueDate)}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Upcoming ({recommendations.upcoming.count})</h2>
            {recommendations.upcoming.requests.length === 0 ? (
              <p className="muted">Nothing due in the next 7 days.</p>
            ) : (
              <ul className="link-list">
                {recommendations.upcoming.requests.map((item) => (
                  <li key={item.id}>
                    <Link to={`/requests/${item.id}`}>{item.title}</Link>
                    <span className="muted small">
                      {item.asset ? ` · ${item.asset.name}` : ""} · due {formatDate(item.dueDate)}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2>Assets in maintenance ({recommendations.assetsInMaintenance.count})</h2>
            {recommendations.assetsInMaintenance.assets.length === 0 ? (
              <p className="muted">No assets are under maintenance.</p>
            ) : (
              <ul className="link-list">
                {recommendations.assetsInMaintenance.assets.map((asset) => (
                  <li key={asset.id}>
                    <Link to={`/asset/${asset.id}`}>
                      {asset.name} ({asset.assetCode})
                    </Link>
                    <StatusBadge status={asset.status} kind="asset" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

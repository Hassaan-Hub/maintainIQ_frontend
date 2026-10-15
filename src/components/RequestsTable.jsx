import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";
import PriorityBadge from "./PriorityBadge.jsx";
import { formatDate } from "../utils/format.js";

// Shared table for maintenance request lists (my / assigned / admin).
export default function RequestsTable({
  requests,
  showReporter = false,
  showTechnician = true,
}) {
  return (
    <div className="table-wrap card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Asset</th>
            <th>Priority</th>
            <th>Status</th>
            {showReporter ? <th>Reported by</th> : null}
            {showTechnician ? <th>Technician</th> : null}
            <th>Due</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <Link to={`/requests/${request.id}`}>{request.title}</Link>
                <div className="muted small">
                  {request.category || "—"} · {request.location || "—"}
                </div>
              </td>
              <td>
                {request.asset ? (
                  <Link to={`/asset/${request.asset.id}`}>
                    {request.asset.name}
                    <span className="muted small block">{request.asset.assetCode}</span>
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <PriorityBadge priority={request.priority} />
              </td>
              <td>
                <StatusBadge status={request.status} />
              </td>
              {showReporter ? (
                <td>{request.reportedBy ? request.reportedBy.username : "—"}</td>
              ) : null}
              {showTechnician ? (
                <td>
                  {request.assignedTechnician ? (
                    request.assignedTechnician.username
                  ) : (
                    <span className="muted">Unassigned</span>
                  )}
                </td>
              ) : null}
              <td>{formatDate(request.dueDate)}</td>
              <td>{formatDate(request.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

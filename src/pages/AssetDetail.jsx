import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assetsApi } from "../api/assets.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { formatDateTime } from "../utils/format.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

// Asset detail: full info, the QR label (with download) and a shortcut to
// report an issue for this asset. Admins can edit or delete.
export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === "admin";
  const [pendingDelete, setPendingDelete] = useState(false);

  const { data, loading, error } = useAsyncData(
    () => Promise.all([assetsApi.get(id), assetsApi.qr(id)]),
    [id]
  );

  const asset = data ? data[0].asset : null;
  const qr = data ? data[1] : null;

  if (error && error.status === 404) {
    return (
      <section className="message-page-inline">
        <div className="card message-card">
          <p className="error-code">404</p>
          <h1>Asset not found</h1>
          <p className="muted">This asset does not exist or you do not have access.</p>
          <Link to="/assets" className="btn btn-primary">
            Back to assets
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <p className="asset-kicker">Asset</p>
          <h1>{asset ? asset.name : "Asset"}</h1>
        </div>
        <Link to="/assets" className="btn btn-ghost">
          Back to assets
        </Link>
      </div>

      <ErrorBanner error={error && error.status !== 404 ? error : null} />

      {loading ? (
        <Loading label="Loading asset…" />
      ) : null}

      {asset ? (
        <div className="detail-grid">
          <article className="card">
            <div className="row-between">
              <h2>Details</h2>
              <StatusBadge status={asset.status} kind="asset" />
            </div>
            {asset.imageUrl ? (
              <img
                className="asset-detail-image"
                src={asset.imageUrl}
                alt={asset.name}
              />
            ) : null}
            <dl className="asset-details">
              <div>
                <dt>Asset code</dt>
                <dd className="mono">{asset.assetCode}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{asset.category}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{asset.location}</dd>
              </div>
              {asset.description ? (
                <div>
                  <dt>Description</dt>
                  <dd>{asset.description}</dd>
                </div>
              ) : null}
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(asset.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{formatDateTime(asset.updatedAt)}</dd>
              </div>
            </dl>

            <div className="detail-actions">
              <Link to={`/requests/new?asset=${asset.id}`} className="btn btn-primary">
                Report an issue
              </Link>
              {isAdmin ? (
                <>
                  <Link to={`/admin/assets/${asset.id}/edit`} className="btn btn-ghost">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setPendingDelete(true)}
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </article>

          <article className="card qr-card">
            <h2>QR label</h2>
            <p className="muted small">
              Scanning opens the public page for this asset.
            </p>
            {qr && qr.qrDataUrl ? (
              <>
                <img
                  className="qr-image"
                  src={qr.qrDataUrl}
                  alt={`QR code for ${asset.assetCode}`}
                  width={200}
                  height={200}
                />
                <a
                  className="btn btn-primary"
                  href={qr.qrDataUrl}
                  download={`${asset.assetCode}-qr.png`}
                >
                  Download QR
                </a>
                <p className="muted small break-all">{qr.url}</p>
              </>
            ) : (
              <Loading inline label="Generating QR…" />
            )}
          </article>
        </div>
      ) : null}

      {pendingDelete && asset ? (
        <ConfirmDialog
          title="Delete asset"
          message={`Delete "${asset.name}" (${asset.assetCode})? This cannot be undone.`}
          confirmLabel="Delete"
          onClose={() => setPendingDelete(false)}
          onConfirm={async () => {
            await assetsApi.remove(asset.id);
            setPendingDelete(false);
            navigate("/assets", { replace: true });
          }}
        />
      ) : null}
    </section>
  );
}

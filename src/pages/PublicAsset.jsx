import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { publicApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

// Public page opened by a scanned QR code. No login required. Offers a route
// into the report-issue form: directly when logged in, or via login (which
// returns here / to the form) when not.
export default function PublicAsset() {
  const { assetCode } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [asset, setAsset] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    setAsset(null);

    publicApi
      .getAssetByCode(assetCode)
      .then((data) => {
        if (!active) return;
        setAsset(data.asset);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.status === 404 ? "Asset not found." : err.message);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [assetCode]);

  const reportPath = `/requests/new?assetCode=${encodeURIComponent(assetCode || "")}`;

  return (
    <div className="public-page">
      <header className="public-header">
        <span className="brand">MaintainIQ</span>
        {user ? null : (
          <Link to="/login" state={{ from: location }} className="btn btn-ghost">
            Sign in
          </Link>
        )}
      </header>

      <main className="public-main">
        {status === "loading" ? <Loading label="Loading asset…" /> : null}

        {status === "error" ? (
          <div className="card">
            <h1>Asset lookup</h1>
            <ErrorBanner error={error} />
          </div>
        ) : null}

        {status === "ready" && asset ? (
          <article className="card asset-card">
            <p className="asset-kicker">Asset</p>
            <h1>{asset.name}</h1>
            <StatusBadge status={asset.status} kind="asset" />

            {asset.imageUrl ? (
              <img
                className="asset-detail-image"
                src={asset.imageUrl}
                alt={asset.name}
              />
            ) : null}

            <dl className="asset-details">
              <div>
                <dt>Code</dt>
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
            </dl>

            <div className="detail-actions">
              {user ? (
                <Link to={reportPath} className="btn btn-primary">
                  Report an issue
                </Link>
              ) : authLoading ? null : (
                <Link
                  to="/login"
                  state={{ from: { pathname: "/requests/new", search: `?assetCode=${encodeURIComponent(assetCode || "")}` } }}
                  className="btn btn-primary"
                >
                  Login to report an issue
                </Link>
              )}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}

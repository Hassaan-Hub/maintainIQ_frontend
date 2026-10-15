import { useState } from "react";
import { assetsApi } from "../api/assets.js";
import Loading from "./Loading.jsx";
import ErrorBanner from "./ErrorBanner.jsx";
import StatusBadge from "./StatusBadge.jsx";

// Search-and-select control for choosing an asset. Uses GET /api/assets?search=
// and shows the selected asset (with a change option) so the report form can
// pre-fill an asset coming from a QR scan or asset detail page.
export default function AssetPicker({ value, onChange, disabled = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Runs the asset search. Called by the Search button and by Enter in the
  // search box. It never submits the surrounding report form.
  async function runSearch() {
    const term = query.trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    try {
      const data = await assetsApi.list({ search: term, limit: 10 });
      setResults(data.assets || []);
    } catch (err) {
      setError(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function select(asset) {
    onChange(asset);
    setResults(null);
    setQuery("");
  }

  if (value) {
    return (
      <div className="asset-picker-selected">
        <div>
          <strong>{value.name}</strong>{" "}
          <span className="muted">({value.assetCode})</span>
          <div className="muted small">
            {value.category} · {value.location}
          </div>
        </div>
        <div className="asset-picker-selected-actions">
          <StatusBadge status={value.status} kind="asset" />
          {disabled ? null : (
            <button type="button" className="btn btn-ghost" onClick={() => onChange(null)}>
              Change
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="asset-picker">
      {/* Plain <div>, not a <form>: this control is rendered inside the
          report-issue form, and a nested form is invalid HTML. */}
      <div className="asset-picker-search">
        <input
          type="search"
          className="input"
          placeholder="Search by name or asset code…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              // Prevent Enter from submitting the surrounding report form.
              event.preventDefault();
              runSearch();
            }
          }}
          disabled={disabled}
          aria-label="Search assets"
        />
        <button
          type="button"
          className="btn btn-ghost"
          onClick={runSearch}
          disabled={disabled || loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      <ErrorBanner error={error} />

      {loading ? <Loading inline label="Searching assets…" /> : null}

      {results && results.length === 0 && !loading ? (
        <p className="muted small">No assets matched. Try a different search.</p>
      ) : null}

      {results && results.length > 0 ? (
        <ul className="asset-picker-results">
          {results.map((asset) => (
            <li key={asset.id}>
              <button type="button" className="asset-picker-result" onClick={() => select(asset)}>
                <span>
                  <strong>{asset.name}</strong>{" "}
                  <span className="muted">({asset.assetCode})</span>
                  <span className="muted small block">
                    {asset.category} · {asset.location}
                  </span>
                </span>
                <StatusBadge status={asset.status} kind="asset" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

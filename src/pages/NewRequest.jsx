import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { assetsApi } from "../api/assets.js";
import { requestsApi } from "../api/requests.js";
import { REQUEST_PRIORITIES, PRIORITY_LABELS } from "../utils/constants.js";
import { validateRequestForm, compactErrors } from "../utils/validation.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import FormField from "../components/FormField.jsx";
import AssetPicker from "../components/AssetPicker.jsx";

// Report-an-issue form for any logged-in user. Supports preselection from the
// asset detail page (?asset=<id>) and from a scanned QR code (?assetCode=<code>).
export default function NewRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetIdParam = searchParams.get("asset");
  const assetCodeParam = searchParams.get("assetCode");

  const [asset, setAsset] = useState(null);
  const [preselectNote, setPreselectNote] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    location: "",
    dueDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve a preselected asset (by id, or by code from a QR scan).
  useEffect(() => {
    let active = true;

    async function resolve() {
      try {
        if (assetIdParam) {
          const data = await assetsApi.get(assetIdParam);
          if (active) setAsset(data.asset);
        } else if (assetCodeParam) {
          const data = await assetsApi.list({ search: assetCodeParam, limit: 100 });
          const match = (data.assets || []).find(
            (item) => item.assetCode.toUpperCase() === assetCodeParam.toUpperCase()
          );
          if (!active) return;
          if (match) {
            setAsset(match);
          } else {
            setPreselectNote(`No asset matches the code "${assetCodeParam}". Search below.`);
          }
        }
      } catch {
        if (active) setPreselectNote("We could not load the scanned asset. Search below.");
      }
    }

    if (assetIdParam || assetCodeParam) resolve();
    return () => {
      active = false;
    };
  }, [assetIdParam, assetCodeParam]);

  // Seed category/location from the chosen asset when those fields are empty.
  useEffect(() => {
    if (!asset) return;
    setForm((prev) => ({
      ...prev,
      category: prev.category || asset.category || "",
      location: prev.location || asset.location || "",
    }));
  }, [asset]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const errors = compactErrors(validateRequestForm(form));
    setFieldErrors(errors);

    if (!asset) {
      setError({ message: "Select the asset this issue is about." });
      return;
    }
    if (Object.keys(errors).length > 0) return;

    const payload = {
      asset: asset.id,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
    };
    if (form.category.trim()) payload.category = form.category.trim();
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.dueDate) payload.dueDate = form.dueDate;

    setSubmitting(true);
    try {
      const created = await requestsApi.create(payload);
      navigate(`/requests/${created.request.id}`, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="page-header row-between">
        <div>
          <h1>Report an issue</h1>
          <p className="muted">Tell us what is wrong so it can be fixed.</p>
        </div>
        <Link to="/my-requests" className="btn btn-ghost">
          My requests
        </Link>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <ErrorBanner error={error} />
        {preselectNote ? <p className="status-message status-info">{preselectNote}</p> : null}

        <div className="field">
          <label>Asset</label>
          <AssetPicker value={asset} onChange={setAsset} disabled={submitting} />
        </div>

        <FormField
          id="title"
          label="Title"
          value={form.title}
          onChange={update("title")}
          error={fieldErrors.title}
          maxLength={120}
          placeholder="Short summary of the issue"
          required
        />

        <FormField
          id="description"
          label="Description"
          as="textarea"
          value={form.description}
          onChange={update("description")}
          error={fieldErrors.description}
          maxLength={2000}
          rows={5}
          placeholder="What is happening? Include any useful detail."
          required
        />

        <FormField
          id="priority"
          label="Priority"
          as="select"
          value={form.priority}
          onChange={update("priority")}
          error={fieldErrors.priority}
        >
          {REQUEST_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </FormField>

        <div className="filters-grid">
          <FormField
            id="category"
            label="Category"
            value={form.category}
            onChange={update("category")}
            error={fieldErrors.category}
            maxLength={80}
            hint="Optional — defaults to the asset category."
          />
          <FormField
            id="location"
            label="Location"
            value={form.location}
            onChange={update("location")}
            error={fieldErrors.location}
            maxLength={120}
            hint="Optional — defaults to the asset location."
          />
        </div>

        <FormField
          id="dueDate"
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={update("dueDate")}
          error={fieldErrors.dueDate}
          hint="Optional."
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </button>
          <Link to="/my-requests" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

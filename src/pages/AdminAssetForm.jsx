import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { assetsApi } from "../api/assets.js";
import { uploadsApi, uploadImageToImageKit, validateImageFile } from "../api/uploads.js";
import { useAsyncData } from "../hooks/useAsyncData.js";
import {
  ASSET_STATUSES,
  ASSET_STATUS_LABELS,
} from "../utils/constants.js";
import {
  validateAssetForm,
  compactErrors,
  normalizeAssetCode,
} from "../utils/validation.js";
import Loading from "../components/Loading.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import FormField from "../components/FormField.jsx";

const EMPTY_FORM = {
  name: "",
  assetCode: "",
  category: "",
  location: "",
  description: "",
  status: "active",
};

// Admin-only create/edit form. On edit, assetCode is shown read-only because the
// backend treats it as immutable.
export default function AdminAssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Image state. `imageFile` holds a newly picked File (not yet uploaded);
  // `imageUrl`/`imageFileId` hold the values already saved on the asset.
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFileId, setImageFileId] = useState("");
  // Set when the upload endpoint reports 503, so the image field can show a
  // clear "not configured" hint instead of only a top banner.
  const [uploadsUnavailable, setUploadsUnavailable] = useState(false);

  const { data, loading, error: loadError } = useAsyncData(
    () => (isEdit ? assetsApi.get(id) : Promise.resolve(null)),
    [id]
  );

  useEffect(() => {
    if (isEdit && data && data.asset) {
      const asset = data.asset;
      setForm({
        name: asset.name,
        assetCode: asset.assetCode,
        category: asset.category,
        location: asset.location,
        description: asset.description || "",
        status: asset.status,
      });
      setImageUrl(asset.imageUrl || "");
      setImageFileId(asset.imageFileId || "");
    }
  }, [isEdit, data]);

  // Build a temporary preview URL for a freshly picked file and revoke it when
  // the file changes or the component unmounts (avoids leaking object URLs).
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleImageChange(event) {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    // Reset the input so picking the same file again still fires onChange.
    event.target.value = "";

    if (!file) {
      setImageFile(null);
      return;
    }

    const check = validateImageFile(file);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    setError(null);
    setImageFile(file);
  }

  function removeImage() {
    setImageFile(null);
    setImageUrl("");
    setImageFileId("");
  }

  const previewSrc = imageFile ? imagePreview : imageUrl;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const errors = compactErrors(validateAssetForm(form));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // Start from the image already stored on the asset.
      let nextImageUrl = imageUrl;
      let nextImageFileId = imageFileId;

      if (imageFile) {
        const check = validateImageFile(imageFile);
        if (!check.ok) {
          setError(check.message);
          return;
        }

        try {
          const auth = await uploadsApi.auth();
          const uploaded = await uploadImageToImageKit(imageFile, auth.upload);

          // Remember the uploaded values in state immediately: if the asset
          // save below fails, retrying must not re-upload the file.
          setImageUrl(uploaded.url);
          setImageFileId(uploaded.fileId);
          setImageFile(null);
          nextImageUrl = uploaded.url;
          nextImageFileId = uploaded.fileId;
        } catch (uploadError) {
          // A failed upload (503 when ImageKit is not configured, or any other
          // error) must never block saving the asset: drop the picked file and
          // continue with the image already stored on the asset, if any.
          setImageFile(null);
          if (uploadError && uploadError.status === 503) {
            setUploadsUnavailable(true);
            setError(
              "Image uploads are not configured on the server. Saving without the new image."
            );
          } else {
            setError(
              (uploadError && uploadError.message) ||
                "The image could not be uploaded. Saving without the new image."
            );
          }
        }
      }

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        status: form.status,
        imageUrl: nextImageUrl,
        imageFileId: nextImageFileId,
      };

      if (isEdit) {
        await assetsApi.update(id, payload);
        navigate(`/asset/${id}`, { replace: true });
      } else {
        const created = await assetsApi.create({
          ...payload,
          assetCode: normalizeAssetCode(form.assetCode),
        });
        navigate(`/asset/${created.asset.id}`, { replace: true });
      }
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (isEdit && loading) {
    return <Loading label="Loading asset…" />;
  }

  if (isEdit && loadError && loadError.status === 404) {
    return (
      <section className="message-page-inline">
        <div className="card message-card">
          <p className="error-code">404</p>
          <h1>Asset not found</h1>
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
        <h1>{isEdit ? "Edit asset" : "New asset"}</h1>
        <Link to="/assets" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <ErrorBanner error={error} />

        <FormField
          id="name"
          label="Name"
          value={form.name}
          onChange={update("name")}
          error={fieldErrors.name}
          maxLength={120}
          required
        />

        {isEdit ? (
          <FormField
            id="assetCode"
            label="Asset code"
            value={form.assetCode}
            onChange={() => {}}
            readOnly
            hint="Asset codes cannot be changed after creation."
          />
        ) : (
          <FormField
            id="assetCode"
            label="Asset code"
            value={form.assetCode}
            onChange={update("assetCode")}
            error={fieldErrors.assetCode}
            maxLength={40}
            placeholder="e.g. AC-0012"
            hint="Stored in upper case. Must be unique."
            required
          />
        )}

        <FormField
          id="category"
          label="Category"
          value={form.category}
          onChange={update("category")}
          error={fieldErrors.category}
          maxLength={80}
          required
        />

        <FormField
          id="location"
          label="Location"
          value={form.location}
          onChange={update("location")}
          error={fieldErrors.location}
          maxLength={120}
          required
        />

        <FormField
          id="description"
          label="Description"
          as="textarea"
          value={form.description}
          onChange={update("description")}
          error={fieldErrors.description}
          maxLength={1000}
          rows={4}
        />

        <div className="field">
          <label htmlFor="asset-image">Image</label>
          {previewSrc ? (
            <div className="asset-image-editor">
              <img
                className="asset-image-preview"
                src={previewSrc}
                alt="Asset preview"
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={removeImage}
                disabled={submitting}
              >
                Remove image
              </button>
            </div>
          ) : (
            <p className="muted small">No image yet.</p>
          )}
          <input
            id="asset-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="input"
            onChange={handleImageChange}
            disabled={submitting}
          />
          {uploadsUnavailable ? (
            <p className="field-hint muted">
              Image uploads are not configured on the server.
            </p>
          ) : null}
          <p className="field-hint muted">
            Optional. JPG, PNG or WebP, up to 5 MB. Uploaded to ImageKit when you save.
          </p>
        </div>

        <FormField
          id="status"
          label="Status"
          as="select"
          value={form.status}
          onChange={update("status")}
          error={fieldErrors.status}
        >
          {ASSET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ASSET_STATUS_LABELS[status]}
            </option>
          ))}
        </FormField>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create asset"}
          </button>
          <Link to="/assets" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

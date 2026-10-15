import { apiRequest } from "./client.js";

// Only these formats are accepted, and images may not exceed 5 MB. Kept here so
// both the form and the uploader enforce the same rules.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Validates a picked file before it is sent anywhere. Returns { ok, message }.
export function validateImageFile(file) {
  if (!file) {
    return { ok: false, message: "Choose an image to upload." };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, message: "Only JPG, PNG or WebP images are allowed." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Images must be 5 MB or smaller." };
  }
  return { ok: true };
}

// Admin-only helper that fetches short-lived, signed parameters from the
// backend so the browser can upload a file straight to ImageKit. The ImageKit
// private key never leaves the server.
export const uploadsApi = {
  auth: () => apiRequest("/uploads/auth"),
};

// Uploads a file directly to ImageKit using the signed parameters returned by
// uploadsApi.auth(). This request intentionally omits credentials: it targets
// ImageKit (a different origin) and the signature is the only credential
// needed, so the auth cookie must not be sent.
export async function uploadImageToImageKit(file, params) {
  const check = validateImageFile(file);
  if (!check.ok) {
    throw new Error(check.message);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", file.name);
  form.append("publicKey", params.publicKey);
  form.append("signature", params.signature);
  form.append("expire", String(params.expire));
  form.append("token", params.token);
  form.append("folder", params.folder);
  form.append("useUniqueFileName", "true");

  let response;
  try {
    response = await fetch(params.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new Error("Network error while uploading the image.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || !data || !data.url) {
    const message =
      (data && typeof data.message === "string" && data.message) ||
      "Image upload failed. Please try again.";
    throw new Error(message);
  }

  // { url, fileId, name, filePath, ... }
  return data;
}

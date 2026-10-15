// Small fetch wrapper used by the whole app.
//
// - Sends and receives JSON.
// - Always sends cookies (credentials: "include") because the backend stores
//   the JWT in an HttpOnly cookie named "token". The token is never read or
//   stored by JavaScript.
// - On a non-2xx response it throws an ApiError carrying the HTTP status and
//   the backend's "message" so callers can show it to the user.

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  const options = {
    method,
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  };

  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Network error. Please check your connection.", 0, null);
  }

  // Read the body as text first so an empty or non-JSON body never throws.
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data.message === "string" && data.message) ||
      `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

// Builds a query string from a params object, skipping empty values so the
// backend sees only the filters the caller actually set ("" / null / undefined
// are dropped, 0 and false are kept).
export function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Authentication endpoints. The backend sets/clears the HttpOnly cookie.
export const authApi = {
  me: () => apiRequest("/auth/me"),
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", body: { email, password } }),
  register: (username, email, password) =>
    apiRequest("/auth/register", { method: "POST", body: { username, email, password } }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
};

// Public (unauthenticated) endpoints.
export const publicApi = {
  getAssetByCode: (assetCode) =>
    apiRequest(`/public/assets/${encodeURIComponent(assetCode)}`),
};

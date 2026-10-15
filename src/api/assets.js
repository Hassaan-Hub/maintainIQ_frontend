import { apiRequest, buildQuery } from "./client.js";

// Thin wrappers around /api/assets. Every call goes through apiRequest so the
// HttpOnly cookie is always sent and backend "message" errors surface as
// ApiError with the right status.
export const assetsApi = {
  list: (params) => apiRequest(`/assets${buildQuery(params)}`),
  get: (id) => apiRequest(`/assets/${id}`),
  qr: (id) => apiRequest(`/assets/${id}/qr`),
  create: (body) => apiRequest("/assets", { method: "POST", body }),
  update: (id, body) => apiRequest(`/assets/${id}`, { method: "PATCH", body }),
  remove: (id) => apiRequest(`/assets/${id}`, { method: "DELETE" }),
};

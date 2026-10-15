import { apiRequest, buildQuery } from "./client.js";

// Thin wrappers around /api/maintenance-requests. Endpoint access rules are
// enforced by the backend; the UI only offers actions the caller may use.
export const requestsApi = {
  create: (body) => apiRequest("/maintenance-requests", { method: "POST", body }),
  listMy: (params) => apiRequest(`/maintenance-requests/my${buildQuery(params)}`),
  listAssigned: (params) =>
    apiRequest(`/maintenance-requests/assigned${buildQuery(params)}`),
  listAll: (params) => apiRequest(`/maintenance-requests${buildQuery(params)}`),
  get: (id) => apiRequest(`/maintenance-requests/${id}`),
  history: (id) => apiRequest(`/maintenance-requests/${id}/history`),
  update: (id, body) =>
    apiRequest(`/maintenance-requests/${id}`, { method: "PATCH", body }),
  updateStatus: (id, body) =>
    apiRequest(`/maintenance-requests/${id}/status`, { method: "PATCH", body }),
  assign: (id, body) =>
    apiRequest(`/maintenance-requests/${id}/assign`, { method: "PATCH", body }),
  cancel: (id, body) =>
    apiRequest(`/maintenance-requests/${id}/cancel`, { method: "PATCH", body }),
  remove: (id) => apiRequest(`/maintenance-requests/${id}`, { method: "DELETE" }),
};

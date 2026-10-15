import { apiRequest, buildQuery } from "./client.js";

// Thin wrappers around /api/users (admin only).
export const usersApi = {
  list: (params) => apiRequest(`/users${buildQuery(params)}`),
  create: (body) => apiRequest("/users", { method: "POST", body }),
  updateRole: (id, role) =>
    apiRequest(`/users/${id}/role`, { method: "PATCH", body: { role } }),
};

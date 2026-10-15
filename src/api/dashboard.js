import { apiRequest, buildQuery } from "./client.js";

// Thin wrappers around /api/dashboard. stats/technicians/recommendations are
// admin-only; my-workload is available to technicians and admins.
export const dashboardApi = {
  stats: () => apiRequest("/dashboard/stats"),
  technicians: () => apiRequest("/dashboard/technicians"),
  recommendations: () => apiRequest("/dashboard/recommendations"),
  myWorkload: (params) => apiRequest(`/dashboard/my-workload${buildQuery(params)}`),
};

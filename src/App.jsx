import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { getHomePath } from "./utils/roles.js";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Assets from "./pages/Assets.jsx";
import AssetDetail from "./pages/AssetDetail.jsx";
import AdminAssetForm from "./pages/AdminAssetForm.jsx";
import NewRequest from "./pages/NewRequest.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import RequestDetail from "./pages/RequestDetail.jsx";
import Assigned from "./pages/Assigned.jsx";
import AdminRequests from "./pages/AdminRequests.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import PublicAsset from "./pages/PublicAsset.jsx";
import Forbidden from "./pages/Forbidden.jsx";
import NotFound from "./pages/NotFound.jsx";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  return <Navigate to={user ? getHomePath(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public (no login required). The QR landing page stays public. */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      />
      <Route path="/assets/:assetCode" element={<PublicAsset />} />

      {/* Authenticated shell with the role-based navbar */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Assets — any logged-in user */}
        <Route path="/assets" element={<Assets />} />
        <Route path="/asset/:id" element={<AssetDetail />} />

        {/* Maintenance requests — any logged-in user */}
        <Route path="/requests/new" element={<NewRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/my-requests" element={<MyRequests />} />

        {/* Technician area */}
        <Route
          path="/assigned"
          element={
            <RoleRoute roles={["technician", "admin"]}>
              <Assigned />
            </RoleRoute>
          }
        />

        {/* Admin area */}
        <Route
          path="/dashboard"
          element={
            <RoleRoute roles={["admin"]}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assets"
          element={
            <RoleRoute roles={["admin"]}>
              <Navigate to="/assets" replace />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assets/new"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminAssetForm />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/assets/:id/edit"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminAssetForm />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminRequests />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminUsers />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

# MaintainIQ Frontend

React + Vite (JavaScript) single-page app for MaintainIQ. Talks to the backend
REST API using `fetch` with `credentials: "include"`; the auth JWT is kept in an
HttpOnly cookie and is never stored in `localStorage`.

This is **Phase 3**: asset register (with ImageKit images), maintenance
requests, QR labels, technician and admin areas, on top of the Phase 1
auth/route-guard shell.

## Requirements

- Node.js 18+
- The backend API running on `http://localhost:3000` (see `../backend`)

## Setup

```bash
npm install
```

Optionally copy `.env.example` to `.env`. The only variable is
`VITE_API_BASE_URL`, which defaults to `/api` and normally does not need to be
set.

## Run the dev server

```bash
npm run dev
```

Opens on **http://localhost:5173**. Vite proxies any request to `/api` to
`http://localhost:3000`, so the session cookie stays same-origin in development.

Start the backend first on port 3000, otherwise API calls will fail. The dev
server uses `strictPort: true`, so it refuses to start if 5173 is already taken.

## Build

```bash
npm run build     # output in dist/
npm run preview   # serve the production build locally
```

## Deployment (Vercel)

- **Live URL:** https://maintain-iq-frontend-one.vercel.app
- **Project root:** `frontend` (framework preset: Vite)
- **Config:** `vercel.json` provides the SPA catch-all rewrite
  (`/(.*)` → `/index.html`) so client routes such as `/login` and `/dashboard`
  load on direct navigation and refresh. Vercel checks the filesystem before
  rewrites, so real files under `/assets` are still served as-is.

Environment variable (Settings → Environment Variables, all environments used
for the deploy, then **redeploy** — Vite inlines `VITE_*` values at build time):

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://maintain-iq-backend-dun.vercel.app/api` |

The `/api` suffix is required because the backend registers every route under
`/api`. Never put secrets in `VITE_*` variables — they are embedded in the
public bundle. If the variable is missing the app falls back to `/api`, which
only works when a dev proxy (or a reverse proxy) is present.

## Page map

| Route | Role | Backend endpoints |
| --- | --- | --- |
| `/login` | public | `POST /api/auth/login`, `GET /api/auth/me` |
| `/register` | public | `POST /api/auth/register` |
| `/assets/:assetCode` | public | `GET /api/public/assets/:assetCode` (QR landing page) |
| `/assets` | any logged-in | `GET /api/assets` (search/filters/pagination, thumbnails) |
| `/asset/:id` | any logged-in | `GET /api/assets/:id`, `GET /api/assets/:id/qr` (+ admin edit/delete) |
| `/requests/new` | any logged-in | `GET /api/assets` (asset picker), `POST /api/maintenance-requests` |
| `/my-requests` | any logged-in | `GET /api/maintenance-requests/my` |
| `/requests/:id` | admin / reporter / assigned technician | `GET /:id`, `GET /:id/history`, `PATCH /:id`, `PATCH /:id/status`, `PATCH /:id/assign`, `PATCH /:id/cancel`, `DELETE /:id` |
| `/assigned` | technician, admin | `GET /api/maintenance-requests/assigned`, `GET /api/dashboard/my-workload` |
| `/dashboard` | admin | `GET /api/dashboard/stats`, `/technicians`, `/recommendations` |
| `/admin/assets` | admin | redirects to `/assets` |
| `/admin/assets/new` | admin | `GET /api/uploads/auth` + direct ImageKit upload, `POST /api/assets` |
| `/admin/assets/:id/edit` | admin | `GET /api/assets/:id`, `GET /api/uploads/auth` + direct ImageKit upload, `PATCH /api/assets/:id` |
| `/admin/requests` | admin | `GET /api/maintenance-requests` (search/filters/pagination) |
| `/admin/users` | admin | `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id/role` |

Unauthenticated users hitting a protected route are redirected to `/login` and
returned to the originally requested page after signing in. Logged-in users with
the wrong role see a 403 page.

## Asset images

Admins can attach one photo to an asset on the new/edit asset forms. The browser
fetches short-lived signed parameters from `GET /api/uploads/auth` and uploads
the file **directly to ImageKit** (that request deliberately omits cookies). The
returned `url`/`fileId` are saved with the asset. Thumbnails appear in the asset
list, full images on the asset detail and public QR pages. Image uploads are
optional — if the backend has no ImageKit keys, the endpoint returns `503` and
the app still works without images.

## Project structure

```
src/
  api/
    client.js                # fetch wrapper (JSON, credentials: include, ApiError, buildQuery)
    assets.js                # GET/POST/PATCH/DELETE /api/assets
    requests.js              # /api/maintenance-requests wrappers
    users.js                 # /api/users wrappers
    dashboard.js             # /api/dashboard wrappers
    uploads.js               # GET /api/uploads/auth + direct-to-ImageKit upload
  context/AuthContext.jsx    # user session: me / login / register / logout
  hooks/useAsyncData.js      # loading/error/data + reload for async loads
  components/
    Layout, guards (ProtectedRoute, RoleRoute, RedirectIfAuthenticated)
    Loading, ErrorBanner, EmptyState, Pagination
    StatusBadge, PriorityBadge, Modal, ConfirmDialog
    FormField (input/textarea/select), AssetPicker, RequestsTable
  pages/                     # one component per route (see page map)
  utils/                     # constants (enums, transitions), format, validation, roles
  App.jsx, main.jsx, index.css
```

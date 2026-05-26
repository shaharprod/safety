# RBAC — Role-Based Access Control Design Spec

## Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to everything |
| `safety_officer` | Full access to everything (same as admin) |
| `foreman` | View all features; create/edit only: hazard report, incident report, gate entry |
| `worker` | Worker portal only — authenticated by ID number, views own certs/permits |

## Permission Matrix

| Feature | worker | foreman | safety_officer | admin |
|---------|:------:|:-------:|:--------------:|:-----:|
| Dashboard | — | 👁 | ✅ | ✅ |
| Alerts | — | 👁 | ✅ | ✅ |
| Hazard Report | — | ✅ | ✅ | ✅ |
| Incident Report | — | ✅ | ✅ | ✅ |
| Gate Entry | — | ✅ | ✅ | ✅ |
| Procedures | — | 👁 | ✅ | ✅ |
| Reports | — | 👁 | ✅ | ✅ |
| Safety Audits | — | 👁 | ✅ | ✅ |
| Tool Inspections | — | 👁 | ✅ | ✅ |
| Projects | — | 👁 | ✅ | ✅ |
| Certifications | — | 👁 | ✅ | ✅ |
| Worker Management | — | 👁 | ✅ | ✅ |
| User Management | — | — | ✅ | ✅ |
| Worker Portal | ✅ | — | — | — |

Legend: ✅ view + create/edit/delete · 👁 view only · — no access

## Architecture

### Database
- Add `admin` as a valid role value in the `users` table CHECK constraint.
- Seed one `admin` user (username: `admin`, password: `1234`).
- `foreman` and `safety_officer` users already exist in seed data.

### Backend Middleware
- `requireAuth` — validates JWT, attaches `req.user` (id, role).
- `requireRole(...roles)` — rejects with 403 if `req.user.role` not in list.
- Role hierarchy enforced per-route, not globally.

### Backend Route Guards
Protect write operations (POST/PUT/PATCH/DELETE) for routes that foreman may only read:

| Route | GET | POST/PUT/PATCH/DELETE |
|-------|-----|----------------------|
| `/api/audits*` | foreman+ | safety_officer, admin |
| `/api/tool-inspections*` | foreman+ | safety_officer, admin |
| `/api/projects*` | foreman+ | safety_officer, admin |
| `/api/certifications*` | foreman+ | safety_officer, admin |
| `/api/workers*` | foreman+ | safety_officer, admin |
| `/api/reports*` | foreman+ | — (read-only) |
| `/api/alerts*` | foreman+ | — (read-only) |
| `/api/users*` | safety_officer, admin | safety_officer, admin |
| `/api/hazards/report` | public | public |
| `/api/incidents` | foreman+ | foreman+ |
| `/api/gate/*` | public | public |

### Frontend — Permissions Map
Single `PERMISSIONS` constant in `src/lib/permissions.js`:

```js
export const PERMISSIONS = {
  admin:           { nav: 'all', write: 'all' },
  safety_officer:  { nav: 'all', write: 'all' },
  foreman:         { nav: 'all', write: ['report', 'incident', 'gate'] },
  worker:          { nav: ['worker-portal'], write: [] },
};
```

### Frontend — Nav Filtering
- `foreman`: all nav items visible (👁 mode for restricted pages).
- `admin` / `safety_officer`: all nav items visible (full access).
- `worker`: redirected to `/worker-portal` — never enters `AppLayout`.

### Frontend — Read-Only Mode
Pages that foreman can view but not edit hide action buttons and disable forms using a `readOnly` prop derived from the user's role. No separate read-only routes — same pages, conditional UI.

### Worker Portal
- Already independent (`/worker-portal` route, no JWT required).
- Worker enters their ID number → backend returns their certifications and permits.
- No changes needed to the authentication flow.
- Minor addition: show worker's own certifications list on the WorkerPortal page.

## Data Flow

```
Login → JWT { id, role } → stored in localStorage
  ↓
AppLayout reads role → builds nav + checks write permissions
  ↓
Page component receives readOnly={!canWrite} → hides/shows action buttons
  ↓
API call → backend requireRole middleware → 403 if unauthorized
```

## Files to Create / Modify

| File | Change |
|------|--------|
| `backend/src/middleware/auth.js` | Add `requireRole(...roles)` export |
| `backend/src/routes/audits.js` | Guard write routes with requireRole |
| `backend/src/routes/toolInspections.js` | Guard write routes |
| `backend/src/routes/projects.js` | Guard write routes |
| `backend/src/routes/certifications.js` | Guard write routes |
| `backend/src/routes/workers.js` | Guard write routes |
| `backend/src/routes/users.js` | Guard all routes: safety_officer+ |
| `backend/src/migrate.js` | Add `admin` to users CHECK constraint |
| `backend/src/seed.js` | Ensure admin user has role `admin` |
| `frontend/src/lib/permissions.js` | New — PERMISSIONS map + helpers |
| `frontend/src/App.jsx` | Filter nav by role, pass readOnly to pages |
| `frontend/src/pages/Dashboard.jsx` | Accept readOnly prop |
| `frontend/src/pages/AuditsList.jsx` | Accept readOnly prop (hide New Audit button) |
| `frontend/src/pages/ToolInspections.jsx` | Accept readOnly prop |
| `frontend/src/pages/Projects.jsx` | Accept readOnly prop |
| `frontend/src/pages/WorkerCertifications.jsx` | Accept readOnly prop |
| `frontend/src/pages/AdminWorkers.jsx` | Accept readOnly prop |
| `frontend/src/pages/Procedures.jsx` | Accept readOnly prop |
| `frontend/src/pages/ReportsViewer.jsx` | Accept readOnly prop |
| `frontend/src/pages/Alerts.jsx` | Accept readOnly prop |
| `frontend/src/pages/WorkerPortal.jsx` | Show worker's own certifications |

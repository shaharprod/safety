# Auth + Hazard Treatment Tracking — Design Spec

**Date:** 2026-05-24  
**Version target:** V1.9  
**Status:** Approved

---

## Overview

Add a full authentication system with two roles (foreman, safety officer), then build hazard treatment tracking that leverages those roles. Currently the app has no login; hazards can be reported but not updated. This spec covers both features as a single release.

---

## 1. Database

### New table: `users`

```sql
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  username     TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('foreman', 'safety_officer')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration: add treatment fields to `hazards`

```sql
ALTER TABLE hazards
  ADD COLUMN treated_by_id   INTEGER REFERENCES users(id),
  ADD COLUMN treated_at      TIMESTAMPTZ,
  ADD COLUMN treatment_notes TEXT,
  ADD COLUMN resolved_by_id  INTEGER REFERENCES users(id),
  ADD COLUMN resolved_notes  TEXT;
-- resolved_at already exists
```

### In-memory store (no DB mode)

Both `users` and the new hazard fields are added to the in-memory demo store in `db.js`. A seed safety_officer user (`admin` / `admin123`) is pre-loaded so the app works without a real database.

---

## 2. Backend

### Dependencies to add

- `bcryptjs` — password hashing
- `jsonwebtoken` — JWT generation/verification

### Auth middleware

`src/middleware/auth.js`:
- `requireAuth(req, res, next)` — validates Bearer JWT from Authorization header; attaches `req.user`
- `requireRole(role)` — factory returning middleware that checks `req.user.role`

### New routes: `src/routes/auth.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | none | `{ username, password }` → `{ token, user }`. bcrypt compare. JWT expires 8h. |
| POST | `/api/auth/logout` | none | Client-side only (stateless JWT); endpoint returns 200 for UX. |
| GET | `/api/auth/me` | requireAuth | Returns current user (id, username, full_name, role). |

### New routes: `src/routes/users.js`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users` | safety_officer | List all users (no password_hash). |
| POST | `/api/users` | safety_officer | Create user. Hash password with bcrypt rounds=10. |
| PATCH | `/api/users/:id` | safety_officer | Update full_name, role, or password. |
| DELETE | `/api/users/:id` | safety_officer | Delete user. Cannot delete self. |

### Modified: `src/routes/hazards.js`

Add new endpoint:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/api/hazards/:id/status` | requireAuth | Update hazard status with notes. Role-gated transitions (see below). |

**Status transition rules:**
- `foreman`: `Open → In_Progress`. Body: `{ status: 'In_Progress', treatment_notes }`. Sets `treated_by_id`, `treated_at`.
- `safety_officer`: `In_Progress → Resolved`. Body: `{ status: 'Resolved', resolved_notes }`. Sets `resolved_by_id`, `resolved_at`.
- `safety_officer`: any transition (override for corrections).
- Invalid transitions return 400.

Log activity entry on each status change: `hazard_status_updated`.

---

## 3. Frontend

### Auth context: `src/context/AuthContext.jsx`

Global React context:
- State: `{ user, token, loading }`
- `login(username, password)` — calls API, stores JWT in `localStorage`
- `logout()` — clears localStorage, redirects to `/login`
- `isRole(role)` — helper

### Login page: `src/pages/Login.jsx`

Route: `/login` (public).  
Fields: username, password. Shows error on bad credentials. Redirects to `/` on success.  
Style: matches existing Tailwind dark-blue theme.

### Protected route wrapper

`src/components/ProtectedRoute.jsx` — wraps all existing routes. Redirects to `/login` if no valid token.

### Navbar changes (`App.jsx`)

- Show `full_name + role badge` on the right side of the header
- Add logout button
- Version: bump to `v1.9`

### HazardTable changes (`HazardTable.jsx`)

**New action column** — shown when user is logged in:

| Hazard status | Logged-in role | Button shown |
|---------------|----------------|--------------|
| Open | foreman | "סמן בטיפול" (blue) |
| In_Progress | safety_officer | "אשר טופל" (green) |
| Any | safety_officer | Both buttons (override) |

**Status update modal** (single reusable component `HazardStatusModal.jsx`):
- Title: "סימון בטיפול" or "אישור טיפול"
- Textarea: treatment/resolution notes (required)
- Submit → PATCH `/api/hazards/:id/status` → refresh list

**Treatment history display** (below hazard description in expanded row / card):
- If `treated_at`: "🔧 בטיפול — [full_name], [date], [treatment_notes]"
- If `resolved_at`: "✅ טופל — [full_name], [date], [resolved_notes]"

### Admin page changes (`AdminWorkers.jsx`)

Add a **"משתמשים"** tab (visible only to `safety_officer`):
- Table: username, full_name, role, created_at, actions (edit/delete)
- "הוסף משתמש" form: username, full_name, role, password

---

## 4. Security notes

- Passwords hashed with bcrypt, never stored plain
- JWT secret from `JWT_SECRET` env var (falls back to a dev default, warning in logs)
- No sensitive data in JWT payload (only id, role)
- All `/api/users` and `/api/hazards/:id/status` routes require valid JWT

---

## 5. Backwards compatibility

- All existing routes (`GET /api/hazards`, `POST /api/hazards/report`, etc.) remain unauthenticated — no breaking change for the field report form
- In-memory mode still works; users table pre-seeded with one safety_officer

---

## 6. Verification

1. Run backend tests: `cd backend && npx vitest run` — all 7 pass
2. Start server: `node backend/src/index.js` — starts without DB
3. POST `/api/auth/login` with seed credentials → receive JWT
4. GET `/api/auth/me` with token → returns user
5. PATCH `/api/hazards/1/status` as foreman → status becomes In_Progress
6. PATCH `/api/hazards/1/status` as safety_officer → status becomes Resolved
7. Frontend: login screen appears when unauthenticated, action buttons appear per role
8. Admin tab shows user management only for safety_officer

---

## 7. Out of scope (future)

- Password reset flow
- Session refresh / token rotation
- Multiple sites / multi-tenant
- Audit log export

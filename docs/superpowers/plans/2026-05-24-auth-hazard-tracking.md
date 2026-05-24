# Auth + Hazard Treatment Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT authentication with two roles (foreman / safety_officer) and hazard treatment-status tracking to SafetyOS, releasing as V1.9.

**Architecture:** Backend gets a `users` table (in-memory + PostgreSQL), a JWT auth middleware, and new routes for login/users/hazard-status. Frontend wraps all routes in `ProtectedRoute`, adds a `Login` page, surfaces action buttons in `HazardTable` based on role, and adds a users-management tab to AdminWorkers.

**Tech Stack:** `bcryptjs` (password hashing), `jsonwebtoken` (JWT), React Context (auth state), Tailwind CSS, Vitest + supertest (backend tests)

---

## File Map

| Action | Path |
|--------|------|
| **Create** | `backend/src/middleware/auth.js` |
| **Create** | `backend/src/routes/auth.js` |
| **Create** | `backend/src/routes/users.js` |
| **Create** | `backend/tests/auth.test.js` |
| **Create** | `backend/tests/users-api.test.js` |
| **Create** | `backend/tests/hazard-status.test.js` |
| **Create** | `frontend/src/context/AuthContext.jsx` |
| **Create** | `frontend/src/pages/Login.jsx` |
| **Create** | `frontend/src/components/ProtectedRoute.jsx` |
| **Create** | `frontend/src/components/HazardStatusModal.jsx` |
| **Create** | `frontend/src/components/ChangePasswordModal.jsx` |
| **Modify** | `backend/src/db.js` |
| **Modify** | `backend/src/routes/hazards.js` |
| **Modify** | `backend/src/index.js` |
| **Modify** | `frontend/src/lib/api.js` |
| **Modify** | `frontend/src/App.jsx` |
| **Modify** | `frontend/src/components/HazardTable.jsx` |
| **Modify** | `frontend/src/pages/AdminWorkers.jsx` |
| **Modify** | `frontend/src/pages/Dashboard.jsx` |

---

## Task 1: Install backend dependencies

**Files:** `backend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd backend && npm install bcryptjs jsonwebtoken
```

Expected: both packages appear under `dependencies` in `package.json`.

- [ ] **Step 2: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add bcryptjs and jsonwebtoken"
```

---

## Task 2: Extend db.js — users store + hazard treatment fields

**Files:** `backend/src/db.js`

- [ ] **Step 1: Add bcryptjs import at the top of db.js (after existing imports)**

```js
import bcrypt from 'bcryptjs';
```

- [ ] **Step 2: Add `users` array to the `store` object (after `activity_logs: []`)**

```js
  users: [
    { id: 1, username: 'admin', password_hash: bcrypt.hashSync('1234', 10), full_name: 'ממונה בטיחות', role: 'safety_officer', created_at: new Date() }
  ],
```

- [ ] **Step 3: Add `users: 1` to the `_id` counter object**

The existing `_id` line reads:
```js
  _id: { safety_hazards: 4, site_access_logs: 1, safety_audits: 1, audit_items: 1, safety_incidents: 2, activity_logs: 1, site_workers: 11, tool_inspections: 1, tool_inspection_items: 1, projects: 11, worker_certifications: 1 }
```

Change to:
```js
  _id: { safety_hazards: 4, site_access_logs: 1, safety_audits: 1, audit_items: 1, safety_incidents: 2, activity_logs: 1, site_workers: 11, tool_inspections: 1, tool_inspection_items: 1, projects: 11, worker_certifications: 1, users: 2 }
```

- [ ] **Step 4: Add treatment fields to existing hazard seed entries**

Find the three hazard seed objects inside `safety_hazards: [...]` and add the new fields to each:

```js
{ id: 1, description: 'גידור חסר בקצה פיגום בקומה שלישית', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'High', status: 'Open', created_at: new Date(Date.now() - 2 * 86_400_000), resolved_at: null, treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_notes: null },
{ id: 2, description: 'מטף כיבוי אש פג תוקף ביציאת חירום', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'רינה בטיחות', severity: 'Medium', status: 'In_Progress', created_at: new Date(Date.now() - 5 * 86_400_000), resolved_at: null, treated_by_id: 1, treated_at: new Date(Date.now() - 4 * 86_400_000), treatment_notes: 'הוזמן מטף חדש', resolved_by_id: null, resolved_notes: null },
{ id: 3, description: 'כבל חשמל חשוף ליד אזור הרטבה', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'Urgent', status: 'Open', created_at: new Date(Date.now() - 1 * 86_400_000), resolved_at: null, treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_notes: null },
```

- [ ] **Step 5: Also update the INSERT handler to include treatment fields in new hazards**

Find this inside `memQuery` (around line 63-69):
```js
  if (s.startsWith('INSERT INTO SAFETY_HAZARDS')) {
    const [description, image_url, supervisor_email, supervisor_name, severity] = params;
    const row = { id: store._id.safety_hazards++, description, image_url, supervisor_email, supervisor_name, severity, status: 'Open', created_at: new Date(), resolved_at: null };
```

Replace `const row = ...` with:
```js
    const row = { id: store._id.safety_hazards++, description, image_url, supervisor_email, supervisor_name, severity, status: 'Open', created_at: new Date(), resolved_at: null, treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_notes: null };
```

- [ ] **Step 6: Add memQuery handlers for new SQL queries**

Inside `memQuery`, **before** the line `if (s.startsWith('SELECT * FROM SAFETY_HAZARDS')`, add the following blocks in this order:

```js
  // ── safety_hazards by id + status updates ────────────────────────────────
  if (s.includes('FROM SAFETY_HAZARDS WHERE ID')) {
    const h = store.safety_hazards.find(h => h.id === params[0]);
    return { rows: h ? [h] : [] };
  }
  if (s.startsWith('UPDATE SAFETY_HAZARDS') && s.includes('TREATED_BY_ID')) {
    const [status, treated_by_id, treated_at, treatment_notes, id] = params;
    const h = store.safety_hazards.find(h => h.id === id);
    if (!h) return { rows: [] };
    Object.assign(h, { status, treated_by_id, treated_at, treatment_notes });
    return { rows: [h] };
  }
  if (s.startsWith('UPDATE SAFETY_HAZARDS') && s.includes('RESOLVED_BY_ID')) {
    const [status, resolved_by_id, resolved_at, resolved_notes, id] = params;
    const h = store.safety_hazards.find(h => h.id === id);
    if (!h) return { rows: [] };
    Object.assign(h, { status, resolved_by_id, resolved_at, resolved_notes });
    return { rows: [h] };
  }

  // ── users ─────────────────────────────────────────────────────────────────
  if (s.includes('FROM USERS WHERE USERNAME')) {
    const u = store.users.find(u => u.username === params[0]);
    return { rows: u ? [u] : [] };
  }
  if (s.startsWith('SELECT *') && s.includes('FROM USERS WHERE ID')) {
    const u = store.users.find(u => u.id === params[0]);
    return { rows: u ? [u] : [] };
  }
  if (s.startsWith('SELECT ID') && s.includes('FROM USERS WHERE ID')) {
    const u = store.users.find(u => u.id === params[0]);
    if (!u) return { rows: [] };
    const { password_hash, ...safe } = u;
    return { rows: [safe] };
  }
  if (s.startsWith('SELECT ID') && s.includes('FROM USERS')) {
    return { rows: store.users.map(({ password_hash, ...u }) => u) };
  }
  if (s.startsWith('INSERT INTO USERS')) {
    const [username, password_hash, full_name, role] = params;
    if (store.users.find(u => u.username === username)) {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    }
    const row = { id: store._id.users++, username, password_hash, full_name, role, created_at: new Date() };
    store.users.push(row);
    const { password_hash: _, ...safe } = row;
    return { rows: [safe] };
  }
  if (s.startsWith('UPDATE USERS') && s.includes('PASSWORD_HASH') && s.includes('FULL_NAME')) {
    const [full_name, role, password_hash, id] = params;
    const u = store.users.find(u => u.id === id);
    if (!u) return { rows: [] };
    Object.assign(u, { full_name, role, password_hash });
    const { password_hash: _, ...safe } = u;
    return { rows: [safe] };
  }
  if (s.startsWith('UPDATE USERS') && s.includes('PASSWORD_HASH')) {
    const [password_hash, id] = params;
    const u = store.users.find(u => u.id === id);
    if (!u) return { rows: [] };
    u.password_hash = password_hash;
    return { rows: [{ id: u.id }] };
  }
  if (s.startsWith('UPDATE USERS')) {
    const [full_name, role, id] = params;
    const u = store.users.find(u => u.id === id);
    if (!u) return { rows: [] };
    Object.assign(u, { full_name, role });
    const { password_hash: _, ...safe } = u;
    return { rows: [safe] };
  }
  if (s.startsWith('DELETE FROM USERS')) {
    const id = params[0];
    const idx = store.users.findIndex(u => u.id === id);
    if (idx === -1) return { rows: [] };
    store.users.splice(idx, 1);
    return { rows: [{ id }] };
  }
```

- [ ] **Step 7: Verify server still starts**

```bash
cd backend && node src/index.js
```

Expected: `SafetyOS API running on port 4000` (press Ctrl+C to stop)

- [ ] **Step 8: Commit**

```bash
git add backend/src/db.js
git commit -m "feat: add users store and hazard treatment fields to db"
```

---

## Task 3: Auth middleware

**Files:**
- Create: `backend/src/middleware/auth.js`

- [ ] **Step 1: Create the file**

```js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'safetyos-dev-secret';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/auth.js
git commit -m "feat: add JWT auth middleware"
```

---

## Task 4: Auth routes + tests

**Files:**
- Create: `backend/src/routes/auth.js`
- Create: `backend/tests/auth.test.js`

- [ ] **Step 1: Write the failing test first**

Create `backend/tests/auth.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../src/db.js', () => ({ pool: { query: vi.fn() } }));
import { pool } from '../src/db.js';
import app from '../src/index.js';

const JWT_SECRET = 'safetyos-dev-secret';
const passwordHash = bcrypt.hashSync('testpass', 10);
const seedUser = { id: 1, username: 'admin', password_hash: passwordHash, full_name: 'ממונה', role: 'safety_officer', created_at: new Date() };
const validToken = jwt.sign({ id: 1, role: 'safety_officer' }, JWT_SECRET);

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('safety_officer');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 on wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('returns 400 if body is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'admin', full_name: 'ממונה', role: 'safety_officer', created_at: new Date() }] });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('admin');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/password', () => {
  it('changes password with correct current password', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [seedUser] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ currentPassword: 'testpass', newPassword: 'newpass123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 401 with wrong current password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass123' });
    expect(res.status).toBe(401);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).patch('/api/auth/password').send({ currentPassword: 'a', newPassword: 'b' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd backend && npx vitest run tests/auth.test.js
```

Expected: tests fail with import/route-not-found errors (route doesn't exist yet).

- [ ] **Step 3: Create `backend/src/routes/auth.js`**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'safetyos-dev-secret';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } });
});

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, full_name, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 4: Mount route in index.js (temporary — full mount in Task 7)**

Add to `backend/src/index.js` after the existing imports and before `app.get('/api/health'...)`:

```js
import authRouter from './routes/auth.js';
```

And after the existing `app.use(...)` calls:

```js
app.use('/api/auth', authRouter);
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd backend && npx vitest run tests/auth.test.js
```

Expected: all auth tests pass.

- [ ] **Step 6: Run full test suite**

```bash
cd backend && npx vitest run
```

Expected: all 7 existing tests + new auth tests pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/auth.js backend/tests/auth.test.js backend/src/index.js
git commit -m "feat: add auth routes (login, me, change-password)"
```

---

## Task 5: Users routes + tests

**Files:**
- Create: `backend/src/routes/users.js`
- Create: `backend/tests/users-api.test.js`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/users-api.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/db.js', () => ({ pool: { query: vi.fn() } }));
import { pool } from '../src/db.js';
import app from '../src/index.js';

const JWT_SECRET = 'safetyos-dev-secret';
const officerToken = jwt.sign({ id: 1, role: 'safety_officer' }, JWT_SECRET);
const foremanToken  = jwt.sign({ id: 2, role: 'foreman' }, JWT_SECRET);

const userRow = { id: 2, username: 'foreman1', full_name: 'מנהל עבודה', role: 'foreman', created_at: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/users', () => {
  it('returns user list for safety_officer', async () => {
    pool.query.mockResolvedValueOnce({ rows: [userRow] });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 for foreman', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${foremanToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('creates a user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [userRow] });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ username: 'foreman1', password: 'pass123', full_name: 'מנהל עבודה', role: 'foreman' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('foreman1');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ username: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 403 for foreman', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${foremanToken}`)
      .send({ username: 'x', password: 'y', full_name: 'z', role: 'foreman' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes a user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when deleting self', async () => {
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd backend && npx vitest run tests/users-api.test.js
```

Expected: failures (route doesn't exist yet).

- [ ] **Step 3: Create `backend/src/routes/users.js`**

```js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('safety_officer'));

router.get('/', async (_, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at ASC'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { username, password, full_name, role } = req.body;
  if (!username || !password || !full_name || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['foreman', 'safety_officer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, created_at',
      [username, hash, full_name, role]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Username already exists' });
    throw e;
  }
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { full_name, role, password } = req.body;
  if (!full_name || !role) return res.status(400).json({ error: 'Missing fields' });

  let rows;
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    ({ rows } = await pool.query(
      'UPDATE users SET full_name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, username, full_name, role, created_at',
      [full_name, role, hash, id]
    ));
  } else {
    ({ rows } = await pool.query(
      'UPDATE users SET full_name = $1, role = $2 WHERE id = $3 RETURNING id, username, full_name, role, created_at',
      [full_name, role, id]
    ));
  }
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 4: Mount route in index.js**

Add import:
```js
import usersRouter from './routes/users.js';
```

Add route (alongside the other `app.use` calls):
```js
app.use('/api/users', usersRouter);
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd backend && npx vitest run tests/users-api.test.js
```

Expected: all users-api tests pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/users.js backend/tests/users-api.test.js backend/src/index.js
git commit -m "feat: add user CRUD routes (safety_officer only)"
```

---

## Task 6: Hazard status endpoint + tests

**Files:**
- Modify: `backend/src/routes/hazards.js`
- Create: `backend/tests/hazard-status.test.js`

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/hazard-status.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

vi.mock('../src/db.js', () => ({ pool: { query: vi.fn() } }));
import { pool } from '../src/db.js';
import app from '../src/index.js';

const JWT_SECRET = 'safetyos-dev-secret';
const officerToken = jwt.sign({ id: 1, role: 'safety_officer' }, JWT_SECRET);
const foremanToken  = jwt.sign({ id: 2, role: 'foreman' }, JWT_SECRET);

const openHazard     = { id: 1, status: 'Open',        treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_at: null, resolved_notes: null };
const inProgressHazard = { id: 1, status: 'In_Progress', treated_by_id: 2, treated_at: new Date(), treatment_notes: 'בטיפול', resolved_by_id: null, resolved_at: null, resolved_notes: null };

beforeEach(() => vi.clearAllMocks());

describe('PATCH /api/hazards/:id/status', () => {
  it('foreman can mark Open hazard as In_Progress', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [openHazard] })
      .mockResolvedValueOnce({ rows: [{ ...openHazard, status: 'In_Progress', treated_by_id: 2, treatment_notes: 'תוקן' }] });

    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${foremanToken}`)
      .send({ status: 'In_Progress', treatment_notes: 'תוקן' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In_Progress');
  });

  it('safety_officer can mark In_Progress hazard as Resolved', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [inProgressHazard] })
      .mockResolvedValueOnce({ rows: [{ ...inProgressHazard, status: 'Resolved', resolved_by_id: 1, resolved_notes: 'טופל' }] });

    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'Resolved', resolved_notes: 'טופל' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  it('foreman cannot mark hazard as Resolved', async () => {
    pool.query.mockResolvedValueOnce({ rows: [inProgressHazard] });

    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${foremanToken}`)
      .send({ status: 'Resolved', resolved_notes: 'done' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown hazard', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/hazards/999/status')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'In_Progress' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/hazards/1/status').send({ status: 'In_Progress' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

```bash
cd backend && npx vitest run tests/hazard-status.test.js
```

Expected: failures (endpoint doesn't exist yet).

- [ ] **Step 3: Add the status endpoint to `backend/src/routes/hazards.js`**

At the top of the file, add the import:
```js
import { requireAuth } from '../middleware/auth.js';
```

At the end of the file, before `export default router`, add:

```js
router.patch('/:id/status', requireAuth, async (req, res) => {
  const hazardId = Number(req.params.id);
  const { status, treatment_notes, resolved_notes } = req.body;
  const { id: userId, role } = req.user;

  const { rows: [hazard] } = await pool.query(
    'SELECT * FROM safety_hazards WHERE id = $1', [hazardId]
  );
  if (!hazard) return res.status(404).json({ error: 'Hazard not found' });

  if (status === 'In_Progress') {
    const now = new Date();
    const { rows } = await pool.query(
      'UPDATE safety_hazards SET status = $1, treated_by_id = $2, treated_at = $3, treatment_notes = $4 WHERE id = $5 RETURNING *',
      ['In_Progress', userId, now, treatment_notes || null, hazardId]
    );
    return res.json(rows[0]);
  }

  if (status === 'Resolved') {
    if (role !== 'safety_officer') return res.status(403).json({ error: 'Only safety officer can resolve hazards' });
    const now = new Date();
    const { rows } = await pool.query(
      'UPDATE safety_hazards SET status = $1, resolved_by_id = $2, resolved_at = $3, resolved_notes = $4 WHERE id = $5 RETURNING *',
      ['Resolved', userId, now, resolved_notes || null, hazardId]
    );
    return res.json(rows[0]);
  }

  return res.status(400).json({ error: 'Invalid status value' });
});
```

- [ ] **Step 4: Run all backend tests**

```bash
cd backend && npx vitest run
```

Expected: all tests pass (7 original + auth tests + users-api tests + hazard-status tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/hazards.js backend/tests/hazard-status.test.js
git commit -m "feat: add PATCH /hazards/:id/status endpoint with role guards"
```

---

## Task 7: Wire up all routes in index.js (cleanup)

**Files:** `backend/src/index.js`

The auth route was temporarily added in Task 4. Now do the full clean mount.

- [ ] **Step 1: Verify `backend/src/index.js` has these imports and mounts**

The file should already contain (from Tasks 4 and 5):

```js
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
```

And:
```js
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
```

If any are missing, add them. The complete routes section should look like:

```js
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth',            authRouter);
app.use('/api/users',           usersRouter);
app.use('/api/hazards',         hazardsRouter);
app.use('/api/gate',            workersRouter);
app.use('/api/workers',         workersRouter);
app.use('/api/reports',         reportsRouter);
app.use('/api/audits',          auditsRouter);
app.use('/api/incidents',       incidentsRouter);
app.use('/api/activity',        activityRouter);
app.use('/api/tool-inspections',toolInspectionsRouter);
app.use('/api/projects',        projectsRouter);
app.use('/api/certifications',  certificationsRouter);
```

- [ ] **Step 2: Smoke test the server**

```bash
cd backend && node src/index.js &
sleep 2
curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"1234"}'
kill %1
```

Expected: JSON response with `token` and `user` fields.

- [ ] **Step 3: Run full test suite one more time**

```bash
cd backend && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.js
git commit -m "chore: clean up route mounts in index.js"
```

---

## Task 8: Frontend API additions

**Files:** `frontend/src/lib/api.js`

- [ ] **Step 1: Add auth, users, and hazard-status API functions**

Append to the end of `frontend/src/lib/api.js`:

```js
// ── Auth ──────────────────────────────────────────────────────────────────────
function authHeader() {
  const token = localStorage.getItem('safetyos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function getMe() {
  const res = await fetch('/api/auth/me', { headers: authHeader() });
  if (!res.ok) return null;
  return res.json();
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch('/api/auth/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

// ── Users management ─────────────────────────────────────────────────────────
export async function getUsers() {
  return (await fetch('/api/users', { headers: authHeader() })).json();
}

export async function addUser(data) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}

// ── Hazard status update ──────────────────────────────────────────────────────
export async function updateHazardStatus(id, data) {
  const res = await fetch(`/api/hazards/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat: add auth, users, and hazard-status API functions"
```

---

## Task 9: AuthContext

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('safetyos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    getMe().then(u => {
      if (u) setUser(u);
      else { localStorage.removeItem('safetyos_token'); setToken(null); }
    }).finally(() => setLoading(false));
  }, [token]);

  function login(userData, jwt) {
    localStorage.setItem('safetyos_token', jwt);
    setToken(jwt);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('safetyos_token');
    setToken(null);
    setUser(null);
  }

  function isRole(role) {
    return user?.role === role;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Wrap the app with AuthProvider in `frontend/src/main.jsx`**

Open `frontend/src/main.jsx`. It will look something like:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

Change to:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx frontend/src/main.jsx
git commit -m "feat: add AuthContext with login/logout/isRole"
```

---

## Task 10: Login page

**Files:**
- Create: `frontend/src/pages/Login.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await loginApi(username, password);
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🦺</div>
          <h1 className="text-2xl font-bold text-gray-800">SafetyOS</h1>
          <p className="text-sm text-gray-500 mt-1">מערכת ניהול בטיחות</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שם משתמש</label>
            <input
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">סיסמה</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 mt-2"
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">SafetyOS v1.9</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat: add Login page"
```

---

## Task 11: ProtectedRoute + App.jsx (routes, navbar, version bump)

**Files:**
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create ProtectedRoute**

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">טוען...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

- [ ] **Step 2: Rewrite `frontend/src/App.jsx`**

Replace the entire file with:

```jsx
import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FieldReport from './pages/FieldReport.jsx';
import GateControl from './pages/GateControl.jsx';
import AuditsList from './pages/AuditsList.jsx';
import AuditNew from './pages/AuditNew.jsx';
import AuditSession from './pages/AuditSession.jsx';
import IncidentReport from './pages/IncidentReport.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import ReportsViewer from './pages/ReportsViewer.jsx';
import AdminWorkers from './pages/AdminWorkers.jsx';
import ToolInspections from './pages/ToolInspections.jsx';
import ToolInspectionSession from './pages/ToolInspectionSession.jsx';
import Projects from './pages/Projects.jsx';
import WorkerCertifications from './pages/WorkerCertifications.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';

const NAV = [
  { to: '/',         label: 'בקרה',      icon: '🏠', end: true },
  { to: '/audits',   label: 'בקרות',     icon: '📋' },
  { to: '/report',   label: 'מפגע',      icon: '⚠️' },
  { to: '/incident', label: 'אירוע',     icon: '🔍' },
  { to: '/gate',     label: 'כניסה',     icon: '🔑' },
  { to: '/tools',    label: 'כלים',      icon: '🔧' },
  { to: '/projects', label: 'פרוייקטים', icon: '🏗️' },
  { to: '/certs',    label: 'הסמכות',    icon: '🎓' },
  { to: '/reports',  label: 'דוחות',     icon: '📊' },
  { to: '/admin',    label: 'אדמין',     icon: '⚙️' },
];

const ROLE_LABEL = { safety_officer: 'ממונה בטיחות', foreman: 'מנהל עבודה' };

function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 z-50">
      <div className="flex overflow-x-auto scrollbar-none">
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-2 text-[9px] font-medium transition shrink-0 flex-1 min-w-[54px] ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`
            }>
            {({ isActive }) => (
              <>
                <span className={`text-xl leading-none mb-0.5 ${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePw, setShowChangePw] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-wide">
            🦺 SafetyOS <span className="text-xs font-normal text-blue-300 ml-1">v1.9</span>
          </span>

          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                    isActive ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
                  }`
                }>
                <span>{icon}</span> {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium leading-tight">{user.full_name}</span>
                  <span className="text-xs text-blue-300">{ROLE_LABEL[user.role] || user.role}</span>
                </div>
                <button
                  onClick={() => setShowChangePw(true)}
                  title="שנה סיסמה"
                  className="p-1.5 rounded-lg hover:bg-blue-800 transition text-blue-200 hover:text-white text-lg"
                >🔐</button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-blue-200 hover:text-white border border-blue-600 hover:border-blue-400 px-2 py-1 rounded-lg transition"
                >יציאה</button>
              </>
            )}
            <span className="md:hidden text-sm text-blue-200">מערכת ניהול בטיחות</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-6">
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/report"          element={<FieldReport />} />
          <Route path="/gate"            element={<GateControl />} />
          <Route path="/audits"          element={<AuditsList />} />
          <Route path="/audit/new/:type" element={<AuditNew />} />
          <Route path="/audit/:id"       element={<AuditSession />} />
          <Route path="/incident"        element={<IncidentReport />} />
          <Route path="/activity"        element={<ActivityLog />} />
          <Route path="/reports"         element={<ReportsViewer />} />
          <Route path="/tools"           element={<ToolInspections />} />
          <Route path="/tool-inspection/:id" element={<ToolInspectionSession />} />
          <Route path="/projects"        element={<Projects />} />
          <Route path="/certs"           element={<WorkerCertifications />} />
          <Route path="/admin"           element={<AdminWorkers />} />
        </Routes>
      </main>

      <BottomNav />

      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

- [ ] **Step 3: Update `frontend/index.html` title**

In `frontend/index.html`, verify title is already updated to v1.9 (it was set to v1.8 in a prior release). If not, change to:
```html
<title>SafetyOS v1.9 - מערכת ניהול בטיחות</title>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ProtectedRoute.jsx frontend/src/App.jsx frontend/index.html
git commit -m "feat: add ProtectedRoute, login flow, user info in navbar, v1.9"
```

---

## Task 12: HazardStatusModal

**Files:**
- Create: `frontend/src/components/HazardStatusModal.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { useState } from 'react';
import { updateHazardStatus } from '../lib/api.js';

export default function HazardStatusModal({ hazard, targetStatus, onClose, onDone }) {
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const isResolving = targetStatus === 'Resolved';
  const title       = isResolving ? 'אישור סיום טיפול' : 'סימון ליקוי בטיפול';
  const notesLabel  = isResolving ? 'הערות סיום' : 'תיאור הפעולה שננקטה';
  const btnLabel    = isResolving ? '✅ אשר טופל' : '🔧 סמן בטיפול';
  const btnColor    = isResolving ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700';

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = isResolving
        ? { status: 'Resolved', resolved_notes: notes }
        : { status: 'In_Progress', treatment_notes: notes };
      await updateHazardStatus(hazard.id, body);
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-600"><span className="font-medium">ליקוי:</span> {hazard.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{notesLabel}</label>
            <textarea
              required
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="תאר את הפעולה שבוצעה..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
              ביטול
            </button>
            <button type="submit" disabled={saving}
              className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${btnColor}`}>
              {saving ? 'שומר...' : btnLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/HazardStatusModal.jsx
git commit -m "feat: add HazardStatusModal component"
```

---

## Task 13: Update HazardTable — action buttons + treatment history

**Files:** `frontend/src/components/HazardTable.jsx`

The current file is 82 lines. Replace entirely with the version below, which accepts two new props (`currentUser`, `onStatusUpdate`) and shows action buttons + treatment history.

- [ ] **Step 1: Replace `frontend/src/components/HazardTable.jsx`**

```jsx
import React, { useState } from 'react';
import HazardStatusModal from './HazardStatusModal.jsx';

const SEVERITY_COLORS = {
  Low:    'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High:   'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
};
const SEVERITY_LABELS = { Low: 'נמוכה', Medium: 'בינונית', High: 'גבוהה', Urgent: 'דחוף' };
const STATUS_LABELS   = { Open: 'פתוח', In_Progress: 'בטיפול', Resolved: 'טופל' };
const STATUS_COLORS   = { Open: 'text-red-600', In_Progress: 'text-yellow-600', Resolved: 'text-green-600' };
const STATUS_BG       = { Open: 'bg-red-50 border-red-200', In_Progress: 'bg-yellow-50 border-yellow-200', Resolved: 'bg-green-50 border-green-200' };

const docNum = (prefix, id) => `${prefix}-${String(id).padStart(3, '0')}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('he-IL') : '';

function ActionButtons({ hazard, currentUser, onAction }) {
  if (!currentUser) return null;
  const { role } = currentUser;

  if (hazard.status === 'Open' && (role === 'foreman' || role === 'safety_officer')) {
    return (
      <button onClick={() => onAction(hazard, 'In_Progress')}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition whitespace-nowrap">
        🔧 סמן בטיפול
      </button>
    );
  }
  if (hazard.status === 'In_Progress' && role === 'safety_officer') {
    return (
      <button onClick={() => onAction(hazard, 'Resolved')}
        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg transition whitespace-nowrap">
        ✅ אשר טופל
      </button>
    );
  }
  return null;
}

function TreatmentHistory({ hazard }) {
  const lines = [];
  if (hazard.treated_at) {
    lines.push(`🔧 בטיפול — ${fmtDate(hazard.treated_at)}${hazard.treatment_notes ? `: ${hazard.treatment_notes}` : ''}`);
  }
  if (hazard.resolved_at) {
    lines.push(`✅ טופל — ${fmtDate(hazard.resolved_at)}${hazard.resolved_notes ? `: ${hazard.resolved_notes}` : ''}`);
  }
  if (lines.length === 0) return null;
  return (
    <div className="mt-1 space-y-0.5">
      {lines.map((l, i) => <p key={i} className="text-xs text-gray-500 italic">{l}</p>)}
    </div>
  );
}

export default function HazardTable({ hazards, currentUser, onStatusUpdate }) {
  const [modal, setModal] = useState(null); // { hazard, targetStatus }

  if (!hazards || hazards.length === 0) {
    return <p className="text-center text-gray-500 py-10">אין מפגעים להצגה</p>;
  }

  function openModal(hazard, targetStatus) {
    setModal({ hazard, targetStatus });
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {hazards.map(h => (
          <div key={h.id} className={`rounded-xl border p-4 ${STATUS_BG[h.status] || 'bg-white border-gray-200'}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 font-semibold">{docNum('HAZ', h.id)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[h.severity]}`}>
                  {SEVERITY_LABELS[h.severity] || h.severity}
                </span>
              </div>
              <span className={`text-sm font-semibold ${STATUS_COLORS[h.status]}`}>
                {STATUS_LABELS[h.status] || h.status}
              </span>
            </div>
            <p className="text-gray-800 text-sm font-medium mb-1">{h.description}</p>
            <TreatmentHistory hazard={h} />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
              <span>{fmtDate(h.created_at)}</span>
              <span>{h.supervisor_name}</span>
            </div>
            <div className="mt-2">
              <ActionButtons hazard={h} currentUser={currentUser} onAction={openModal} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs">
            <tr>
              <th className="px-4 py-3 text-right">#</th>
              <th className="px-4 py-3 text-right">תיאור</th>
              <th className="px-4 py-3 text-right">דחיפות</th>
              <th className="px-4 py-3 text-right">ממונה</th>
              <th className="px-4 py-3 text-right">סטטוס</th>
              <th className="px-4 py-3 text-right">תאריך</th>
              {currentUser && <th className="px-4 py-3 text-right">פעולה</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {hazards.map(h => (
              <tr key={h.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 text-gray-400 text-xs font-mono font-semibold">{docNum('HAZ', h.id)}</td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="truncate" title={h.description}>{h.description}</p>
                  <TreatmentHistory hazard={h} />
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[h.severity]}`}>
                    {SEVERITY_LABELS[h.severity] || h.severity}
                  </span>
                </td>
                <td className="px-4 py-3">{h.supervisor_name}</td>
                <td className={`px-4 py-3 font-medium ${STATUS_COLORS[h.status]}`}>
                  {STATUS_LABELS[h.status] || h.status}
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(h.created_at)}</td>
                {currentUser && (
                  <td className="px-4 py-3">
                    <ActionButtons hazard={h} currentUser={currentUser} onAction={openModal} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <HazardStatusModal
          hazard={modal.hazard}
          targetStatus={modal.targetStatus}
          onClose={() => setModal(null)}
          onDone={onStatusUpdate}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Update `frontend/src/pages/Dashboard.jsx` to pass new props**

Open `frontend/src/pages/Dashboard.jsx`. Find the `<HazardTable hazards={...} />` usage.

Add the import at the top:
```jsx
import { useAuth } from '../context/AuthContext.jsx';
```

Inside the component function, add:
```jsx
const { user } = useAuth();
```

Change the HazardTable usage from:
```jsx
<HazardTable hazards={hazards} />
```
to:
```jsx
<HazardTable hazards={hazards} currentUser={user} onStatusUpdate={load} />
```

Where `load` is the existing function that fetches hazards. If Dashboard uses a different pattern (e.g., a `useEffect` with `setHazards`), wrap the fetch in a named function `load` and call it in `useEffect(() => { load(); }, [])`, then pass it as `onStatusUpdate`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/HazardTable.jsx frontend/src/pages/Dashboard.jsx
git commit -m "feat: add status action buttons and treatment history to HazardTable"
```

---

## Task 14: ChangePasswordModal

**Files:**
- Create: `frontend/src/components/ChangePasswordModal.jsx`

- [ ] **Step 1: Create the file**

```jsx
import React, { useState } from 'react';
import { changePassword } from '../lib/api.js';

export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next !== confirm) { setError('הסיסמאות אינן תואמות'); return; }
    if (next.length < 4)  { setError('הסיסמה חייבת לפחות 4 תווים'); return; }
    setSaving(true);
    setError('');
    try {
      await changePassword(current, next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">שינוי סיסמה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {success ? (
          <div className="px-6 py-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-600 font-semibold">הסיסמה שונתה בהצלחה</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סיסמה נוכחית</label>
              <input type="password" required value={current} onChange={e => setCurrent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סיסמה חדשה</label>
              <input type="password" required value={next} onChange={e => setNext(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">אשר סיסמה חדשה</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                ביטול
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">
                {saving ? 'שומר...' : 'שנה סיסמה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

(The modal is already imported and used in App.jsx from Task 11 — nothing else to wire up.)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/ChangePasswordModal.jsx
git commit -m "feat: add ChangePasswordModal"
```

---

## Task 15: Add users management tab to AdminWorkers

**Files:** `frontend/src/pages/AdminWorkers.jsx`

The current file (264 lines) manages site workers. Add a tab for "משתמשים" visible only to safety_officer.

- [ ] **Step 1: Replace `frontend/src/pages/AdminWorkers.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { getWorkers, addWorker, updateWorker, deleteWorker, getUsers, addUser, updateUser, deleteUser } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_WORKER = { first_name: '', last_name: '', id_number: '', google_email: '', has_height_clearance: false, last_training_date: '' };
const EMPTY_USER   = { username: '', full_name: '', role: 'foreman', password: '' };

function accessStatus(worker) {
  if (!worker.last_training_date) return { label: 'ללא הדרכה', color: 'bg-red-100 text-red-700' };
  const days = Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000);
  return days <= 365
    ? { label: `מורשה (${days} ימים)`, color: 'bg-green-100 text-green-700' }
    : { label: `נדחה (${days} ימים)`, color: 'bg-red-100 text-red-700' };
}

function toDateInput(d) {
  if (!d) return '';
  try { return new Date(d).toISOString().split('T')[0]; } catch { return ''; }
}

const ROLE_LABEL = { safety_officer: 'ממונה בטיחות', foreman: 'מנהל עבודה' };

// ─── Workers Tab ──────────────────────────────────────────────────────────────
function WorkersTab() {
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_WORKER);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setWorkers(await getWorkers()); } finally { setLoading(false); }
  }

  function openNew() { setForm(EMPTY_WORKER); setEditId(0); setError(''); }
  function openEdit(w) { setForm({ ...w, last_training_date: toDateInput(w.last_training_date), google_email: w.google_email || '' }); setEditId(w.id); setError(''); }
  function closeForm() { setEditId(null); setError(''); }
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      editId === 0 ? await addWorker(form) : await updateWorker(editId, form);
      await load();
      closeForm();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteWorker(id); setConfirmDel(null); await load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">עובדי אתר</h2>
          <p className="text-sm text-gray-500 mt-0.5">בקרת גישה לאתר — Google ו-תעודת זהות</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + הוסף עובד
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && (
        <>
          <div className="space-y-3 md:hidden">
            {workers.map(w => {
              const st = accessStatus(w);
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{w.first_name} {w.last_name}</p>
                      <p className="text-xs text-gray-400">ת.ז. {w.id_number}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                    {w.google_email && <p>📧 {w.google_email}</p>}
                    <p>{w.has_height_clearance ? '✅ אישור עבודה בגובה' : '❌ ללא אישור גובה'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(w)} className="flex-1 border border-blue-300 text-blue-700 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition">עריכה</button>
                    <button onClick={() => setConfirmDel(w)} className="flex-1 border border-red-300 text-red-600 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition">מחיקה</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right">שם</th>
                  <th className="px-4 py-3 text-right">ת.ז.</th>
                  <th className="px-4 py-3 text-right">אימייל Google</th>
                  <th className="px-4 py-3 text-right">גובה</th>
                  <th className="px-4 py-3 text-right">הדרכה אחרונה</th>
                  <th className="px-4 py-3 text-right">סטטוס</th>
                  <th className="px-4 py-3 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workers.map(w => {
                  const st = accessStatus(w);
                  return (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{w.first_name} {w.last_name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{w.id_number}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{w.google_email || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-center">{w.has_height_clearance ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-gray-500">{w.last_training_date ? new Date(w.last_training_date).toLocaleDateString('he-IL') : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(w)} className="text-blue-600 hover:text-blue-800 text-xs font-medium transition">עריכה</button>
                          <button onClick={() => setConfirmDel(w)} className="text-red-500 hover:text-red-700 text-xs font-medium transition">מחיקה</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {workers.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">אין עובדים רשומים</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'הוסף עובד חדש' : 'עריכת עובד'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">שם פרטי *</label><input required value={form.first_name} onChange={e => f('first_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">שם משפחה *</label><input required value={form.last_name} onChange={e => f('last_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">תעודת זהות *</label><input required value={form.id_number} onChange={e => f('id_number', e.target.value)} inputMode="numeric" maxLength={9} placeholder="9 ספרות" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">אימייל Google</label><input type="email" value={form.google_email} onChange={e => f('google_email', e.target.value)} placeholder="name@gmail.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">תאריך הדרכה אחרונה</label><input type="date" value={form.last_training_date} onChange={e => f('last_training_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.has_height_clearance} onChange={e => f('has_height_clearance', e.target.checked)} className="w-4 h-4 accent-blue-600" /><span className="text-sm text-gray-700">אישור עבודה בגובה</span></label>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור שינויים'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת עובד</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.first_name} {confirmDel.last_name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button onClick={() => handleDelete(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const { user: me } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setUsers(await getUsers()); } finally { setLoading(false); }
  }

  function openNew() { setForm(EMPTY_USER); setEditId(0); setError(''); }
  function openEdit(u) { setForm({ username: u.username, full_name: u.full_name, role: u.role, password: '' }); setEditId(u.id); setError(''); }
  function closeForm() { setEditId(null); setError(''); }
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editId === 0) {
        await addUser(form);
      } else {
        const payload = { full_name: form.full_name, role: form.role };
        if (form.password) payload.password = form.password;
        await updateUser(editId, payload);
      }
      await load();
      closeForm();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await deleteUser(id); setConfirmDel(null); await load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">משתמשי המערכת</h2>
          <p className="text-sm text-gray-500 mt-0.5">ניהול מנהלי עבודה וממונים</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          + הוסף משתמש
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 py-10">טוען...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right">שם משתמש</th>
                <th className="px-4 py-3 text-right">שם מלא</th>
                <th className="px-4 py-3 text-right">תפקיד</th>
                <th className="px-4 py-3 text-right">נוצר</th>
                <th className="px-4 py-3 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{u.username}</td>
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'safety_officer' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('he-IL')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:text-blue-800 text-xs font-medium transition">עריכה</button>
                      {u.id !== me?.id && (
                        <button onClick={() => setConfirmDel(u)} className="text-red-500 hover:text-red-700 text-xs font-medium transition">מחיקה</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-gray-400">אין משתמשים</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId === 0 ? 'הוסף משתמש' : 'עריכת משתמש'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-4 space-y-4">
              {editId === 0 && (
                <div><label className="block text-xs font-medium text-gray-600 mb-1">שם משתמש *</label>
                  <input required value={form.username} onChange={e => f('username', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              )}
              <div><label className="block text-xs font-medium text-gray-600 mb-1">שם מלא *</label>
                <input required value={form.full_name} onChange={e => f('full_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד *</label>
                <select required value={form.role} onChange={e => f('role', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="foreman">מנהל עבודה</option>
                  <option value="safety_officer">ממונה בטיחות</option>
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">{editId === 0 ? 'סיסמה *' : 'סיסמה חדשה (ריק = ללא שינוי)'}</label>
                <input type="password" required={editId === 0} value={form.password} onChange={e => f('password', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50">{saving ? 'שומר...' : editId === 0 ? 'הוסף' : 'שמור'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">מחיקת משתמש</h3>
            <p className="text-gray-500 text-sm mb-5">האם למחוק את <strong>{confirmDel.full_name}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">ביטול</button>
              <button onClick={() => handleDelete(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminWorkers() {
  const { isRole } = useAuth();
  const [tab, setTab] = useState('workers');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ניהול</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('workers')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === 'workers' ? 'bg-white border border-b-white border-gray-200 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
          👷 עובדים
        </button>
        {isRole('safety_officer') && (
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === 'users' ? 'bg-white border border-b-white border-gray-200 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
            🔑 משתמשים
          </button>
        )}
      </div>

      {tab === 'workers' && <WorkersTab />}
      {tab === 'users'   && isRole('safety_officer') && <UsersTab />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/AdminWorkers.jsx
git commit -m "feat: add users management tab to AdminWorkers (safety_officer only)"
```

---

## Task 16: Final — tests, version, build, commit, push as V1.9

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npx vitest run
```

Expected: all tests pass (7 original + auth + users-api + hazard-status).

- [ ] **Step 2: Verify frontend builds**

```bash
cd frontend && npm run build
```

Expected: clean build with no errors.

- [ ] **Step 3: Update title in index.html to v1.9**

In `frontend/index.html`, ensure:
```html
<title>SafetyOS v1.9 - מערכת ניהול בטיחות</title>
```

- [ ] **Step 4: Final commit with version tag**

```bash
git add -A
git commit -m "feat: V1.9 — auth system, user roles, hazard treatment tracking, change password"
```

- [ ] **Step 5: Push**

```bash
git push
```

Expected: push succeeds, Render deploys automatically.

- [ ] **Step 6: Manual smoke test (after Render deploy)**

1. Open the app URL — redirected to `/login`
2. Login with `admin` / `1234` — lands on dashboard
3. Verify navbar shows "ממונה בטיחות" + logout button
4. Click 🔐 → change password modal appears
5. Open a hazard with status "Open" — "🔧 סמן בטיפול" button visible
6. Click it → modal → submit with notes → status changes to "בטיפול"
7. As safety_officer, "✅ אשר טופל" appears on in-progress hazard
8. Navigate to `/admin` → two tabs visible: "עובדים" + "משתמשים"
9. Add a foreman user, login as foreman — can mark in-progress but cannot resolve

---

## Spec Coverage Check

| Spec Section | Covered By |
|---|---|
| Users table + migration | Task 2 |
| In-memory seed (admin/1234) | Task 2 |
| bcryptjs + jsonwebtoken | Task 1 |
| requireAuth middleware | Task 3 |
| requireRole middleware | Task 3 |
| POST /api/auth/login | Task 4 |
| GET /api/auth/me | Task 4 |
| PATCH /api/auth/password | Task 4 |
| GET/POST/PATCH/DELETE /api/users | Task 5 |
| PATCH /api/hazards/:id/status (foreman) | Task 6 |
| PATCH /api/hazards/:id/status (officer) | Task 6 |
| Role-gated transitions | Task 6 |
| AuthContext (login/logout/isRole) | Task 9 |
| Login page | Task 10 |
| ProtectedRoute | Task 11 |
| Navbar user + logout | Task 11 |
| HazardTable action buttons | Task 13 |
| Treatment history display | Task 13 |
| Change password modal | Task 14 |
| Admin users tab (safety_officer only) | Task 15 |
| Version v1.9 | Tasks 11, 16 |

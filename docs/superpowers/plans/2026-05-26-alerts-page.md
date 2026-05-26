# Alerts Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/alerts` page that shows all expiring/expired worker certifications and safety training in one place, grouped by urgency.

**Architecture:** New backend endpoint `/api/alerts` runs two SQL queries (certifications + training), merges and sorts the results, and returns summary counts + item list. Frontend page renders summary cards and collapsible urgency groups. Nav entry added second in the list.

**Tech Stack:** Express + pg (backend), React + Tailwind (frontend), existing `pool` from `db.js`, existing `requireAuth` middleware.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/src/routes/alerts.js` | SQL queries, merge, sort, respond |
| Modify | `backend/src/index.js` | Register `/api/alerts` route |
| Modify | `frontend/src/lib/api.js` | Add `getAlerts()` fetch helper |
| Create | `frontend/src/pages/Alerts.jsx` | Summary cards + grouped list UI |
| Modify | `frontend/src/App.jsx` | Nav entry + `<Route>` + version bump to v3.2 |

---

## Task 1: Backend — alerts route

**Files:**
- Create: `backend/src/routes/alerts.js`

- [ ] **Create the file with two SQL queries merged into one response**

```js
// backend/src/routes/alerts.js
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  // Certifications expiring within 90 days (including already expired)
  const { rows: certRows } = await pool.query(`
    SELECT
      'cert'                                          AS type,
      wc.worker_id,
      sw.first_name || ' ' || sw.last_name           AS worker_name,
      wc.cert_type                                    AS label,
      wc.expiry_date::date                            AS expiry_date,
      (wc.expiry_date::date - CURRENT_DATE)::int      AS days_left
    FROM worker_certifications wc
    JOIN site_workers sw ON sw.id = wc.worker_id
    WHERE wc.expiry_date IS NOT NULL
      AND wc.expiry_date::date <= CURRENT_DATE + INTERVAL '90 days'
  `);

  // Workers whose training expires within 90 days or is already expired/missing
  // Training validity = 365 days. Warn when last_training_date <= today - 275 days.
  const { rows: trainingRows } = await pool.query(`
    SELECT
      'training'                                                        AS type,
      sw.id                                                             AS worker_id,
      sw.first_name || ' ' || sw.last_name                             AS worker_name,
      'הדרכת בטיחות'                                                    AS label,
      (sw.last_training_date + INTERVAL '365 days')::date              AS expiry_date,
      ((sw.last_training_date + INTERVAL '365 days')::date
        - CURRENT_DATE)::int                                            AS days_left
    FROM site_workers sw
    WHERE sw.last_training_date IS NOT NULL
      AND sw.last_training_date <= CURRENT_DATE - INTERVAL '275 days'
    UNION ALL
    SELECT
      'training'                    AS type,
      sw.id                         AS worker_id,
      sw.first_name || ' ' || sw.last_name AS worker_name,
      'הדרכת בטיחות — חסרה'         AS label,
      NULL                          AS expiry_date,
      -9999                         AS days_left
    FROM site_workers sw
    WHERE sw.last_training_date IS NULL
  `);

  const items = [...certRows, ...trainingRows]
    .map(r => ({
      ...r,
      days_left: Number(r.days_left),
      urgency: r.days_left < 0 ? 'expired' : r.days_left <= 30 ? 'soon30' : 'soon90',
    }))
    .sort((a, b) => a.days_left - b.days_left);

  const summary = {
    expired: items.filter(i => i.urgency === 'expired').length,
    soon30:  items.filter(i => i.urgency === 'soon30').length,
    soon90:  items.filter(i => i.urgency === 'soon90').length,
  };

  res.json({ summary, items });
});

export default router;
```

- [ ] **Register the route in `backend/src/index.js`**

Add this import after the existing route imports:
```js
import alertsRouter from './routes/alerts.js';
```

Add this line after `app.use('/api/users', usersRouter);`:
```js
app.use('/api/alerts', alertsRouter);
```

- [ ] **Commit**

```bash
git add backend/src/routes/alerts.js backend/src/index.js
git commit -m "feat: add /api/alerts endpoint for expiry notifications"
```

---

## Task 2: Frontend — API helper

**Files:**
- Modify: `frontend/src/lib/api.js`

- [ ] **Append `getAlerts()` to the end of `frontend/src/lib/api.js`**

```js
// ── Alerts ────────────────────────────────────────────────────────────────────
export async function getAlerts() {
  const res = await fetch('/api/alerts', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}
```

- [ ] **Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat: add getAlerts() api helper"
```

---

## Task 3: Frontend — Alerts page

**Files:**
- Create: `frontend/src/pages/Alerts.jsx`

- [ ] **Create the full page component**

```jsx
// frontend/src/pages/Alerts.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAlerts } from '../lib/api.js';

const URGENCY_CONFIG = {
  expired: { label: 'פג תוקף',      bg: 'bg-red-50',    border: 'border-red-300',  badge: 'bg-red-100 text-red-700',    dot: '🔴', days: d => d === -9999 ? 'הדרכה חסרה' : `פג לפני ${Math.abs(d)} ימים` },
  soon30:  { label: 'עד 30 יום',    bg: 'bg-orange-50', border: 'border-orange-300',badge: 'bg-orange-100 text-orange-700',dot: '🟠', days: d => `פג בעוד ${d} ימים` },
  soon90:  { label: 'עד 90 יום',    bg: 'bg-yellow-50', border: 'border-yellow-300',badge: 'bg-yellow-100 text-yellow-700',dot: '🟡', days: d => `פג בעוד ${d} ימים` },
};

function SummaryCard({ urgency, count }) {
  const cfg = URGENCY_CONFIG[urgency];
  return (
    <div className={`rounded-xl border ${count > 0 ? cfg.border : 'border-gray-200'} ${count > 0 ? cfg.bg : 'bg-white'} p-4 text-center`}>
      <div className="text-2xl mb-1">{cfg.dot}</div>
      <div className={`text-3xl font-bold ${count > 0 ? '' : 'text-gray-400'}`}>{count}</div>
      <div className="text-xs text-gray-500 mt-1">{cfg.label}</div>
    </div>
  );
}

function AlertGroup({ urgency, items }) {
  const [open, setOpen] = useState(true);
  const cfg = URGENCY_CONFIG[urgency];
  const navigate = useNavigate();
  if (!items.length) return null;
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${cfg.border} ${cfg.bg} font-medium text-right`}
      >
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{items.length}</span>
        <span className="flex items-center gap-2">
          <span>{cfg.dot}</span>
          <span>{cfg.label}</span>
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(item.type === 'cert' ? '/certs' : '/admin')}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
              >
                {item.type === 'cert' ? 'הסמכות ←' : 'עובדים ←'}
              </button>
              <div className="flex-1 text-right min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{item.worker_name}</div>
                <div className="text-xs text-gray-500 truncate">{item.label}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg">{item.type === 'cert' ? '📋' : '🎓'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAlerts().then(setData).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600 text-center py-10">{error}</div>;
  if (!data) return <div className="text-center py-10 text-gray-400">טוען...</div>;

  const { summary, items } = data;
  const total = summary.expired + summary.soon30 + summary.soon90;
  const grouped = {
    expired: items.filter(i => i.urgency === 'expired'),
    soon30:  items.filter(i => i.urgency === 'soon30'),
    soon90:  items.filter(i => i.urgency === 'soon90'),
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-5">🔔 התראות תוקף</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <SummaryCard urgency="expired" count={summary.expired} />
        <SummaryCard urgency="soon30"  count={summary.soon30}  />
        <SummaryCard urgency="soon90"  count={summary.soon90}  />
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-500 font-medium">הכל תקין — אין התראות פעילות</p>
        </div>
      )}

      {/* Grouped lists */}
      <AlertGroup urgency="expired" items={grouped.expired} />
      <AlertGroup urgency="soon30"  items={grouped.soon30}  />
      <AlertGroup urgency="soon90"  items={grouped.soon90}  />
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/pages/Alerts.jsx
git commit -m "feat: add Alerts page with urgency grouping"
```

---

## Task 4: Wire navigation + route + version bump

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Add import for Alerts page** — add after the existing page imports:

```js
import Alerts from './pages/Alerts.jsx';
```

- [ ] **Add nav entry** — insert as the second item in the NAV array (after `בקרה`):

```js
const NAV = [
  { to: '/dashboard', label: 'בקרה',      icon: '🏠', end: true },
  { to: '/alerts',    label: 'התראות',    icon: '🔔'            },  // ← add this line
  { to: '/audits',    label: 'בקרות',     icon: '📋'            },
  // ... rest unchanged
];
```

- [ ] **Add route** — inside `<Routes>` in `AppLayout`, add:

```jsx
<Route path="/alerts" element={<Alerts />} />
```

- [ ] **Bump version** — change `v3.0` to `v3.2` in the header span:

```jsx
🦺 SafetyOS <span className="text-xs font-normal text-blue-300 ml-1">v3.2</span>
```

- [ ] **Commit and push as V3.2**

```bash
git add frontend/src/App.jsx
git commit -m "feat: V3.2 — alerts page for expiring certifications and training"
git push
```

---

## Self-Review

- ✅ Spec coverage: backend endpoint ✓, summary cards ✓, grouped collapsible list ✓, empty state ✓, nav entry ✓, training + certs ✓
- ✅ No placeholders or TBDs
- ✅ Type consistency: `urgency` field values (`expired`/`soon30`/`soon90`) match between backend and URGENCY_CONFIG keys
- ✅ `days_left` cast to `int` in SQL and `Number()` in JS to avoid string comparison bugs
- ✅ Workers with `last_training_date IS NULL` handled as `days_left = -9999` with special label

# Alerts Page — Expiry Notifications

## Context
SafetyOS needs a dedicated page that proactively surfaces expiring or expired worker certifications and safety training. Currently this data exists but is only visible inside individual pages (WorkerCertifications, AdminWorkers). A central alert view lets safety officers act before violations occur.

## Scope
- New backend endpoint returning all expiry alerts in one request
- New frontend page displaying alerts grouped by urgency
- Navigation entry added to the main nav

## Backend

### Endpoint
`GET /api/alerts` — protected (requireAuth)

### Logic
Two SQL queries combined into one response:

1. **Certifications**: `worker_certifications JOIN site_workers WHERE expiry_date <= TODAY + 90 days`
2. **Training**: `site_workers WHERE last_training_date <= TODAY - 275 days` (flags 90 days before the 365-day expiry limit)

### Response shape
```json
{
  "summary": { "expired": 4, "soon30": 2, "soon90": 5 },
  "items": [
    {
      "type": "cert",
      "urgency": "expired" | "soon30" | "soon90",
      "days_left": -12,
      "worker_id": 3,
      "worker_name": "דני אברהם",
      "label": "עבודה בגובה",
      "expiry_date": "2026-01-10"
    }
  ]
}
```

Items sorted: expired first (most negative days_left first), then by days_left ascending.

### File
`backend/src/routes/alerts.js` — registered in `index.js` as `/api/alerts`

## Frontend

### Page: `frontend/src/pages/Alerts.jsx`

**Top section — 3 summary cards:**
- 🔴 פג תוקף (count, red)
- 🟠 עד 30 יום (count, orange)
- 🟡 עד 90 יום (count, yellow)

**Main section — grouped collapsible lists:**
- Each group header: colored badge + count
- Each row: icon (📋 cert / 🎓 training) + worker name + label + days indicator + link button to relevant page (`/certs` for certs, `/admin` for training)
- Days indicator: "פג לפני X ימים" (red) / "פג בעוד X ימים" (orange/yellow)

**Empty state:** ✅ "הכל תקין — אין התראות פעילות"

**Loading state:** skeleton cards

### Navigation
Added to NAV array in `App.jsx`:
```js
{ to: '/alerts', label: 'התראות', icon: '🔔' }
```
Position: second item, after `בקרה`.

Route added to `AppLayout` routes: `<Route path="/alerts" element={<Alerts />} />`

## Files Changed
- `backend/src/routes/alerts.js` — new
- `backend/src/index.js` — register `/api/alerts`
- `frontend/src/pages/Alerts.jsx` — new
- `frontend/src/lib/api.js` — add `getAlerts()` function
- `frontend/src/App.jsx` — add nav entry + route

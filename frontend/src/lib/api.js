export async function reportHazard(formData) {
  const res = await fetch('/api/hazards/report', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHazards() {
  const res = await fetch('/api/hazards');
  if (!res.ok) throw new Error('Failed to fetch hazards');
  return res.json();
}

export async function checkWorker(id_number) {
  const res = await fetch('/api/gate/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_number })
  });
  return { ok: res.ok, data: await res.json() };
}

export function downloadPDF() {
  window.location.href = '/api/reports/pdf';
}

// ── Audits ──────────────────────────────────────────────────────────────────
export async function createAudit(data) {
  const res = await fetch('/api/audits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function getAudits() {
  return (await fetch('/api/audits')).json();
}
export async function getAuditItems(auditId) {
  return (await fetch(`/api/audits/${auditId}/items`)).json();
}
export async function updateAuditItem(auditId, itemId, formData) {
  const res = await fetch(`/api/audits/${auditId}/items/${itemId}`, { method: 'PATCH', body: formData });
  return res.json();
}
export async function closeAudit(auditId) {
  return (await fetch(`/api/audits/${auditId}/close`, { method: 'PATCH' })).json();
}

// ── Incidents ───────────────────────────────────────────────────────────────
export async function reportIncident(formData) {
  const res = await fetch('/api/incidents', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function getIncidents() {
  return (await fetch('/api/incidents')).json();
}

// ── Activity log ────────────────────────────────────────────────────────────
export async function getActivityLog() {
  return (await fetch('/api/activity')).json();
}

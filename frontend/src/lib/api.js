// ── Auth helpers ─────────────────────────────────────────────────────────────
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
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to change password');
  return res.json();
}

// ── Users (admin) ─────────────────────────────────────────────────────────────
export async function getUsers() {
  const res = await fetch('/api/users', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function addUser(data) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create user');
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update user');
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete user');
  return res.json();
}

// ── Hazard status update ──────────────────────────────────────────────────────
export async function updateHazardStatus(id, data) {
  const res = await fetch(`/api/hazards/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update hazard status');
  return res.json();
}

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

export async function checkWorkerByGoogle(credential) {
  const res = await fetch('/api/gate/check-google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  return { ok: res.ok, data: await res.json() };
}

export function downloadPDF() {
  window.location.href = '/api/reports/pdf';
}

// ── Audits ──────────────────────────────────────────────────────────────────
export async function createAudit(data) {
  const res = await fetch('/api/audits', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
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

// ── Admin: workers CRUD ───────────────────────────────────────────────────────
export async function getWorkers() {
  const res = await fetch('/api/workers', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch workers');
  return res.json();
}
export async function addWorker(data) {
  const res = await fetch('/api/workers', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updateWorker(id, data) {
  const res = await fetch(`/api/workers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deleteWorker(id) {
  const res = await fetch(`/api/workers/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Tool Inspections ──────────────────────────────────────────────────────────
export async function getToolInspections() {
  return (await fetch('/api/tool-inspections')).json();
}
export async function getToolInspection(id) {
  return (await fetch(`/api/tool-inspections/${id}`)).json();
}
export async function createToolInspection(data) {
  const res = await fetch('/api/tool-inspections', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function getToolInspectionItems(id) {
  return (await fetch(`/api/tool-inspections/${id}/items`)).json();
}
export async function addToolInspectionItem(id, data) {
  const res = await fetch(`/api/tool-inspections/${id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updateToolInspectionItem(inspId, itemId, data) {
  const res = await fetch(`/api/tool-inspections/${inspId}/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deleteToolInspectionItem(inspId, itemId) {
  const res = await fetch(`/api/tool-inspections/${inspId}/items/${itemId}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function closeToolInspection(id) {
  const res = await fetch(`/api/tool-inspections/${id}/close`, { method: 'PATCH', headers: authHeader() });
  return res.json();
}

// ── Worker Certifications ─────────────────────────────────────────────────────
export async function getCertifications() {
  const res = await fetch('/api/certifications', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch certifications');
  return res.json();
}
export async function getWorkerCertifications(workerId) {
  const res = await fetch(`/api/certifications/worker/${workerId}`, { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch certifications');
  return res.json();
}
export async function addCertification(data) {
  const res = await fetch('/api/certifications', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updateCertification(id, data) {
  const res = await fetch(`/api/certifications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deleteCertification(id) {
  const res = await fetch(`/api/certifications/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Projects ──────────────────────────────────────────────────────────────────
export async function getProjects() {
  const res = await fetch('/api/projects', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}
export async function addProject(data) {
  const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updateProject(id, data) {
  const res = await fetch(`/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deleteProject(id) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export async function getAlerts() {
  const res = await fetch('/api/alerts', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

// ── Company Permits ───────────────────────────────────────────────────────────
export async function getPermits() {
  const res = await fetch('/api/permits', { headers: authHeader() });
  if (!res.ok) throw new Error('Failed to fetch permits');
  return res.json();
}
export async function addPermit(data) {
  const res = await fetch('/api/permits', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function updatePermit(id, data) {
  const res = await fetch(`/api/permits/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export async function deletePermit(id) {
  const res = await fetch(`/api/permits/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

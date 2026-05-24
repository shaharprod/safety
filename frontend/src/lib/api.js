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

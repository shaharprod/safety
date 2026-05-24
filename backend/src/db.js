import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// ── In-memory demo store ─────────────────────────────────────────────────────
const store = {
  subcontractors: [
    { id: 1, company_name: 'חברת א. ביצוע בע"מ', tax_id: '510123456', contact_phone: '054-1234567' }
  ],
  site_workers: [
    { id: 1, first_name: 'משה', last_name: 'לוי',  id_number: '123456789', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() - 100 * 86_400_000), google_email: 'shaharprod@gmail.com' },
    { id: 2, first_name: 'שרה', last_name: 'כהן',  id_number: '987654321', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 400 * 86_400_000), google_email: 'sarah.cohen@gmail.com' }
  ],
  safety_hazards: [
    { id: 1, description: 'גידור חסר בקצה פיגום בקומה שלישית', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'High', status: 'Open', created_at: new Date(Date.now() - 2 * 86_400_000), resolved_at: null },
    { id: 2, description: 'מטף כיבוי אש פג תוקף ביציאת חירום', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'רינה בטיחות', severity: 'Medium', status: 'In_Progress', created_at: new Date(Date.now() - 5 * 86_400_000), resolved_at: null },
    { id: 3, description: 'כבל חשמל חשוף ליד אזור הרטבה', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'Urgent', status: 'Open', created_at: new Date(Date.now() - 1 * 86_400_000), resolved_at: null },
  ],
  site_access_logs: [],
  safety_audits: [],
  audit_items: [],
  safety_incidents: [
    { id: 1, incident_type: 'near_miss', description: 'חומר כימי שפוך על רצפת המחסן ללא סימון', location: 'מחסן ראשי', involved_parties: 'שלושה עובדים', immediate_cause: 'אחסון לא תקין', root_cause: 'חוסר הדרכה על נוהלי אחסון', actions_taken: 'ניקוי מיידי, תלייה שלטים, הדרכת צוות', reporter_name: 'יוסי צוות', created_at: new Date(Date.now() - 3 * 86_400_000) },
  ],
  activity_logs: [],
  _id: { safety_hazards: 4, site_access_logs: 1, safety_audits: 1, audit_items: 1, safety_incidents: 2, activity_logs: 1, site_workers: 3 }
};

function memQuery(sql, params = []) {
  const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

  // ── safety_hazards ──────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM SAFETY_HAZARDS') && !s.includes('WHERE STATUS')) {
    return { rows: [...store.safety_hazards].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM SAFETY_HAZARDS WHERE STATUS')) {
    return { rows: store.safety_hazards.filter(h => h.status === 'Open') };
  }
  if (s.startsWith('INSERT INTO SAFETY_HAZARDS')) {
    const [description, image_url, supervisor_email, supervisor_name, severity] = params;
    const row = { id: store._id.safety_hazards++, description, image_url, supervisor_email, supervisor_name, severity, status: 'Open', created_at: new Date(), resolved_at: null };
    store.safety_hazards.push(row);
    _log('hazard_reported', `מפגע חדש: ${description.slice(0, 60)}`, supervisor_name, row.id, 'hazard');
    return { rows: [row] };
  }

  // ── site_workers ────────────────────────────────────────────────────────────
  if (s.includes('FROM SITE_WORKERS WHERE ID_NUMBER')) {
    const w = store.site_workers.find(w => w.id_number === params[0]);
    return { rows: w ? [w] : [] };
  }
  if (s.includes('FROM SITE_WORKERS WHERE GOOGLE_EMAIL')) {
    const w = store.site_workers.find(w => w.google_email === params[0]);
    return { rows: w ? [w] : [] };
  }
  if (s.startsWith('SELECT * FROM SITE_WORKERS')) {
    return { rows: [...store.site_workers].sort((a, b) => a.last_name.localeCompare(b.last_name)) };
  }
  if (s.startsWith('INSERT INTO SITE_WORKERS')) {
    const [first_name, last_name, id_number, google_email, has_height_clearance, last_training_date, subcontractor_id] = params;
    const row = { id: ++store._id.site_workers, first_name, last_name, id_number, google_email: google_email || null, has_height_clearance: !!has_height_clearance, last_training_date: last_training_date ? new Date(last_training_date) : null, subcontractor_id: subcontractor_id || null };
    store.site_workers.push(row);
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE SITE_WORKERS SET')) {
    const [first_name, last_name, id_number, google_email, has_height_clearance, last_training_date, id] = params;
    const w = store.site_workers.find(w => w.id === id);
    if (!w) return { rows: [] };
    Object.assign(w, { first_name, last_name, id_number, google_email: google_email || null, has_height_clearance: !!has_height_clearance, last_training_date: last_training_date ? new Date(last_training_date) : null });
    return { rows: [w] };
  }
  if (s.startsWith('DELETE FROM SITE_WORKERS WHERE ID=')) {
    const id = params[0];
    const idx = store.site_workers.findIndex(w => w.id === id);
    if (idx === -1) return { rows: [] };
    store.site_workers.splice(idx, 1);
    return { rows: [{ id }] };
  }

  // ── site_access_logs ────────────────────────────────────────────────────────
  if (s.startsWith('INSERT INTO SITE_ACCESS_LOGS')) {
    const [worker_id, access_status] = params;
    const worker = store.site_workers.find(w => w.id === worker_id);
    store.site_access_logs.push({ id: store._id.site_access_logs++, worker_id, access_status, check_in_time: new Date() });
    _log('gate_check', `בדיקת כניסה: ${worker?.first_name} ${worker?.last_name} — ${access_status === 'Allowed' ? 'אושר' : 'נדחה'}`, null, worker_id, 'worker');
    return { rows: [] };
  }

  // ── safety_audits ───────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM SAFETY_AUDITS') && s.includes('ORDER')) {
    return { rows: [...store.safety_audits].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM SAFETY_AUDITS WHERE ID =')) {
    return { rows: store.safety_audits.filter(a => a.id === params[0]) };
  }
  if (s.startsWith('INSERT INTO SAFETY_AUDITS')) {
    const [audit_type, inspector_name, project_name] = params;
    const row = { id: store._id.safety_audits++, audit_type, inspector_name, project_name: project_name || '', status: 'Open', created_at: new Date() };
    store.safety_audits.push(row);
    _log('audit_started', `בקרה חדשה (${audit_type}): ${project_name || '—'} — ${inspector_name}`, inspector_name, row.id, 'audit');
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE SAFETY_AUDITS SET STATUS')) {
    const audit = store.safety_audits.find(a => a.id === params[1]);
    if (audit) { audit.status = params[0]; _log('audit_closed', `בקרה סגורה #${audit.id}`, null, audit.id, 'audit'); }
    return { rows: audit ? [audit] : [] };
  }

  // ── audit_items ─────────────────────────────────────────────────────────────
  if (s.includes('FROM AUDIT_ITEMS WHERE AUDIT_ID')) {
    return { rows: store.audit_items.filter(i => i.audit_id === params[0]) };
  }
  if (s.startsWith('INSERT INTO AUDIT_ITEMS')) {
    const [audit_id, item_text, category, status, notes, photo_url] = params;
    const row = { id: store._id.audit_items++, audit_id, item_text, category: category || '', status: status || 'pending', notes: notes || '', photo_url: photo_url || null, created_at: new Date() };
    store.audit_items.push(row);
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE AUDIT_ITEMS SET STATUS')) {
    const item = store.audit_items.find(i => i.id === params[2]);
    if (item) { item.status = params[0]; item.notes = params[1] || ''; }
    return { rows: item ? [item] : [] };
  }

  // ── safety_incidents ────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM SAFETY_INCIDENTS')) {
    return { rows: [...store.safety_incidents].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.startsWith('INSERT INTO SAFETY_INCIDENTS')) {
    const [incident_type, description, location, involved_parties, immediate_cause, root_cause, actions_taken, image_url, reporter_name] = params;
    const row = { id: store._id.safety_incidents++, incident_type, description, location, involved_parties, immediate_cause, root_cause, actions_taken, image_url, reporter_name, created_at: new Date() };
    store.safety_incidents.push(row);
    _log('incident_reported', `אירוע: ${description.slice(0, 60)}`, reporter_name, row.id, 'incident');
    return { rows: [row] };
  }

  // ── activity_logs ───────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM ACTIVITY_LOGS')) {
    return { rows: [...store.activity_logs].sort((a, b) => b.created_at - a.created_at).slice(0, 100) };
  }
  if (s.startsWith('INSERT INTO ACTIVITY_LOGS')) {
    const [action_type, description, user_name, reference_id, reference_type] = params;
    const row = { id: store._id.activity_logs++, action_type, description, user_name, reference_id, reference_type, created_at: new Date() };
    store.activity_logs.push(row);
    return { rows: [row] };
  }

  return { rows: [] };
}

function _log(action_type, description, user_name, reference_id, reference_type) {
  store.activity_logs.push({
    id: store._id.activity_logs++,
    action_type, description,
    user_name: user_name || null,
    reference_id: reference_id || null,
    reference_type: reference_type || null,
    created_at: new Date()
  });
}

// ── Real pg pool ─────────────────────────────────────────────────────────────
const useReal = !!process.env.DATABASE_URL;
export const pool = useReal
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : { query: (sql, params) => Promise.resolve(memQuery(sql, params)) };

if (!useReal) console.log('⚠️  No DATABASE_URL — running with in-memory demo store');

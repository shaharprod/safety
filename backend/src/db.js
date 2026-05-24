import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// ── In-memory demo store ─────────────────────────────────────────────────────
const store = {
  users: [
    { id: 1, username: 'admin', password_hash: bcrypt.hashSync('1234', 10), full_name: 'ממונה בטיחות', role: 'safety_officer', created_at: new Date() },
  ],
  subcontractors: [
    { id: 1, company_name: 'חברת א. ביצוע בע"מ', tax_id: '510123456', contact_phone: '054-1234567' }
  ],
  site_workers: [
    { id: 1, first_name: 'משה',   last_name: 'לוי',      id_number: '123456789', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() - 100 * 86_400_000), google_email: 'shaharprod@gmail.com' },
    { id: 2, first_name: 'שרה',   last_name: 'כהן',      id_number: '987654321', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 400 * 86_400_000), google_email: 'sarah.cohen@gmail.com' },
    { id: 3, first_name: 'דני',   last_name: 'אברהם',    id_number: '112233445', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() -  80 * 86_400_000), google_email: null },
    { id: 4, first_name: 'רחל',   last_name: 'פרץ',      id_number: '556677889', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() - 200 * 86_400_000), google_email: null },
    { id: 5, first_name: 'יוסי',  last_name: 'מזרחי',    id_number: '223344556', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 310 * 86_400_000), google_email: null },
    { id: 6, first_name: 'אורן',  last_name: 'שפירא',    id_number: '334455667', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() -  45 * 86_400_000), google_email: null },
    { id: 7, first_name: 'מיכל',  last_name: 'גולדברג',  id_number: '445566778', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 150 * 86_400_000), google_email: null },
    { id: 8, first_name: 'עמית',  last_name: 'בן-דוד',   id_number: '667788990', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() - 260 * 86_400_000), google_email: null },
    { id: 9, first_name: 'נועה',  last_name: 'רוזנברג',  id_number: '778899001', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 500 * 86_400_000), google_email: null },
    { id: 10, first_name: 'איתי', last_name: 'חדד',       id_number: '889900112', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() -  20 * 86_400_000), google_email: null },
  ],
  safety_hazards: [
    { id: 1, description: 'גידור חסר בקצה פיגום בקומה שלישית', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'High', status: 'Open', created_at: new Date(Date.now() - 2 * 86_400_000), resolved_at: null, treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_notes: null },
    { id: 2, description: 'מטף כיבוי אש פג תוקף ביציאת חירום', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'רינה בטיחות', severity: 'Medium', status: 'In_Progress', created_at: new Date(Date.now() - 5 * 86_400_000), resolved_at: null, treated_by_id: 1, treated_at: new Date(Date.now() - 3 * 86_400_000), treatment_notes: 'בוצע חידוש מטף', resolved_by_id: null, resolved_notes: null },
    { id: 3, description: 'כבל חשמל חשוף ליד אזור הרטבה', image_url: '', supervisor_email: 'demo@site.com', supervisor_name: 'דני מנהל', severity: 'Urgent', status: 'Open', created_at: new Date(Date.now() - 1 * 86_400_000), resolved_at: null, treated_by_id: null, treated_at: null, treatment_notes: null, resolved_by_id: null, resolved_notes: null },
  ],
  site_access_logs: [],
  safety_audits: [],
  audit_items: [],
  tool_inspections: [],
  tool_inspection_items: [],
  worker_certifications: [],
  projects: [
    { id: 1, name: 'מגדל מגורים א׳',          location: 'תל אביב',       start_date: new Date('2026-01-01'), end_date: new Date('2026-12-31'), manager_name: 'דני כהן',    manager_phone: '052-1234567', manager_email: 'dani@site.com',    status: 'active',    created_at: new Date() },
    { id: 2, name: 'שיפוץ קמפוס משרדים',       location: 'ירושלים',       start_date: new Date('2026-03-01'), end_date: new Date('2026-09-30'), manager_name: 'רחל לוי',   manager_phone: '054-7654321', manager_email: 'rachel@site.com',  status: 'active',    created_at: new Date() },
    { id: 3, name: 'סלילת כביש עוקף',           location: 'פתח תקווה',     start_date: new Date('2025-11-01'), end_date: new Date('2026-06-30'), manager_name: 'אורן שפירא', manager_phone: '050-3344556', manager_email: 'oren@site.com',    status: 'active',    created_at: new Date() },
    { id: 4, name: 'מרכז לוגיסטיקה — שלב ב׳',  location: 'אשדוד',         start_date: new Date('2026-02-15'), end_date: new Date('2027-02-14'), manager_name: 'יוסי מזרחי', manager_phone: '053-9988776', manager_email: 'yossi@site.com',   status: 'active',    created_at: new Date() },
    { id: 5, name: 'שדרוג תשתיות מים',          location: 'חיפה',          start_date: new Date('2025-09-01'), end_date: new Date('2026-03-31'), manager_name: 'משה לוי',    manager_phone: '052-1112223', manager_email: 'moshe@site.com',   status: 'active',    created_at: new Date() },
    { id: 6, name: 'בניין ציבורי — עירייה',      location: 'באר שבע',       start_date: new Date('2025-06-01'), end_date: new Date('2025-12-31'), manager_name: 'עמית בן-דוד', manager_phone: '054-5566778', manager_email: 'amit@site.com',    status: 'completed', created_at: new Date() },
    { id: 7, name: 'מפעל מזון — הרחבה',         location: 'רחובות',        start_date: new Date('2026-04-01'), end_date: new Date('2026-10-31'), manager_name: 'מיכל גולדברג', manager_phone: '050-7788990', manager_email: 'michal@site.com',  status: 'active',    created_at: new Date() },
    { id: 8, name: 'מחסן ותפעול — נתב"ג',       location: 'לוד',           start_date: new Date('2026-05-01'), end_date: new Date('2027-04-30'), manager_name: 'איתי חדד',   manager_phone: '053-2233445', manager_email: 'itai@site.com',    status: 'active',    created_at: new Date() },
    { id: 9, name: 'שיקום מבנה היסטורי',        location: 'יפו',           start_date: new Date('2025-10-01'), end_date: new Date('2026-08-31'), manager_name: 'נועה רוזנברג', manager_phone: '052-6677889', manager_email: 'noa@site.com',     status: 'on_hold',   created_at: new Date() },
    { id: 10, name: 'פארק תעשייה — בנייה חדשה', location: 'קיסריה',        start_date: new Date('2026-06-01'), end_date: new Date('2028-05-31'), manager_name: 'דני אברהם',  manager_phone: '054-4455667', manager_email: 'dani2@site.com',   status: 'active',    created_at: new Date() },
  ],
  safety_incidents: [
    { id: 1, incident_type: 'near_miss', description: 'חומר כימי שפוך על רצפת המחסן ללא סימון', location: 'מחסן ראשי', involved_parties: 'שלושה עובדים', immediate_cause: 'אחסון לא תקין', root_cause: 'חוסר הדרכה על נוהלי אחסון', actions_taken: 'ניקוי מיידי, תלייה שלטים, הדרכת צוות', reporter_name: 'יוסי צוות', created_at: new Date(Date.now() - 3 * 86_400_000) },
  ],
  activity_logs: [],
  _id: { users: 2, safety_hazards: 4, site_access_logs: 1, safety_audits: 1, audit_items: 1, safety_incidents: 2, activity_logs: 1, site_workers: 11, tool_inspections: 1, tool_inspection_items: 1, projects: 11, worker_certifications: 1 }
};

function memQuery(sql, params = []) {
  const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

  // ── users ────────────────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM USERS WHERE USERNAME')) {
    const u = store.users.find(u => u.username === params[0]);
    return { rows: u ? [u] : [] };
  }
  if (s.startsWith('SELECT ID, USERNAME, FULL_NAME, ROLE') && s.includes('FROM USERS WHERE ID')) {
    const u = store.users.find(u => u.id === params[0]);
    if (!u) return { rows: [] };
    return { rows: [{ id: u.id, username: u.username, full_name: u.full_name, role: u.role }] };
  }
  if (s.startsWith('SELECT ID, USERNAME, FULL_NAME, ROLE') && s.includes('FROM USERS ORDER')) {
    return { rows: store.users.map(u => ({ id: u.id, username: u.username, full_name: u.full_name, role: u.role, created_at: u.created_at })) };
  }
  if (s.startsWith('INSERT INTO USERS')) {
    const [username, password_hash, full_name, role] = params;
    const row = { id: store._id.users++, username, password_hash, full_name, role, created_at: new Date() };
    store.users.push(row);
    return { rows: [{ id: row.id, username, full_name, role, created_at: row.created_at }] };
  }
  if (s.startsWith('UPDATE USERS SET') && s.includes('PASSWORD_HASH')) {
    const [password_hash, id] = params;
    const u = store.users.find(u => u.id === id);
    if (u) u.password_hash = password_hash;
    return { rows: u ? [u] : [] };
  }
  if (s.startsWith('UPDATE USERS SET') && !s.includes('PASSWORD_HASH')) {
    const [full_name, role, id] = params;
    const u = store.users.find(u => u.id === id);
    if (!u) return { rows: [] };
    Object.assign(u, { full_name, role });
    return { rows: [{ id: u.id, username: u.username, full_name: u.full_name, role: u.role }] };
  }
  if (s.startsWith('DELETE FROM USERS WHERE ID')) {
    const idx = store.users.findIndex(u => u.id === params[0]);
    if (idx !== -1) store.users.splice(idx, 1);
    return { rows: [{ id: params[0] }] };
  }

  // ── safety_hazards ──────────────────────────────────────────────────────────
  if (s.includes('FROM SAFETY_HAZARDS WHERE ID =') || s.includes('FROM SAFETY_HAZARDS WHERE ID=')) {
    const h = store.safety_hazards.find(h => h.id === params[0]);
    return { rows: h ? [h] : [] };
  }
  if (s.startsWith('SELECT * FROM SAFETY_HAZARDS') && !s.includes('WHERE STATUS')) {
    return { rows: [...store.safety_hazards].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM SAFETY_HAZARDS WHERE STATUS')) {
    return { rows: store.safety_hazards.filter(h => h.status === 'Open') };
  }
  if (s.includes('UPDATE SAFETY_HAZARDS SET STATUS') && s.includes('TREATED_BY_ID')) {
    const [status, treated_by_id, treated_at, treatment_notes, id] = params;
    const h = store.safety_hazards.find(h => h.id === id);
    if (!h) return { rows: [] };
    Object.assign(h, { status, treated_by_id, treated_at, treatment_notes });
    return { rows: [h] };
  }
  if (s.includes('UPDATE SAFETY_HAZARDS SET STATUS') && s.includes('RESOLVED_BY_ID')) {
    const [status, resolved_by_id, resolved_at, resolved_notes, id] = params;
    const h = store.safety_hazards.find(h => h.id === id);
    if (!h) return { rows: [] };
    Object.assign(h, { status, resolved_by_id, resolved_at, resolved_notes });
    return { rows: [h] };
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

  // ── tool_inspections ────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM TOOL_INSPECTIONS') && s.includes('ORDER')) {
    return { rows: [...store.tool_inspections].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM TOOL_INSPECTIONS WHERE ID =')) {
    return { rows: store.tool_inspections.filter(a => a.id === params[0]) };
  }
  if (s.startsWith('INSERT INTO TOOL_INSPECTIONS')) {
    const [tool_type, inspector_name, location, expiry_date] = params;
    const row = { id: store._id.tool_inspections++, tool_type, inspector_name, location: location || '', expiry_date: expiry_date ? new Date(expiry_date) : null, status: 'Open', created_at: new Date() };
    store.tool_inspections.push(row);
    _log('tool_inspection_started', `בדיקת כלים: ${tool_type} — ${inspector_name}`, inspector_name, row.id, 'tool_inspection');
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE TOOL_INSPECTIONS SET STATUS')) {
    const insp = store.tool_inspections.find(a => a.id === params[1]);
    if (insp) { insp.status = params[0]; _log('tool_inspection_closed', `בדיקת כלים סגורה #${insp.id}`, null, insp.id, 'tool_inspection'); }
    return { rows: insp ? [insp] : [] };
  }

  // ── tool_inspection_items ────────────────────────────────────────────────────
  if (s.includes('FROM TOOL_INSPECTION_ITEMS WHERE INSPECTION_ID')) {
    return { rows: store.tool_inspection_items.filter(i => i.inspection_id === params[0]) };
  }
  if (s.startsWith('INSERT INTO TOOL_INSPECTION_ITEMS')) {
    const [inspection_id, tool_name, serial_number, condition, notes] = params;
    const row = { id: store._id.tool_inspection_items++, inspection_id, tool_name, serial_number: serial_number || '', condition: condition || 'pending', notes: notes || '', created_at: new Date() };
    store.tool_inspection_items.push(row);
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE TOOL_INSPECTION_ITEMS SET CONDITION')) {
    const item = store.tool_inspection_items.find(i => i.id === params[3]);
    if (item) { item.condition = params[0]; item.notes = params[1] || ''; item.serial_number = params[2] !== undefined ? params[2] : (item.serial_number || ''); }
    return { rows: item ? [item] : [] };
  }
  if (s.startsWith('DELETE FROM TOOL_INSPECTION_ITEMS WHERE ID')) {
    const idx = store.tool_inspection_items.findIndex(i => i.id === params[0]);
    if (idx !== -1) store.tool_inspection_items.splice(idx, 1);
    return { rows: [] };
  }

  // ── projects ─────────────────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM PROJECTS') && s.includes('ORDER')) {
    return { rows: [...store.projects].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM PROJECTS WHERE ID =')) {
    return { rows: store.projects.filter(p => p.id === params[0]) };
  }
  if (s.startsWith('INSERT INTO PROJECTS')) {
    const [name, location, start_date, end_date, manager_name, manager_phone, manager_email, status] = params;
    const row = { id: store._id.projects++, name, location: location || '', start_date: start_date ? new Date(start_date) : null, end_date: end_date ? new Date(end_date) : null, manager_name, manager_phone: manager_phone || '', manager_email: manager_email || '', status: status || 'active', created_at: new Date() };
    store.projects.push(row);
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE PROJECTS SET')) {
    const [name, location, start_date, end_date, manager_name, manager_phone, manager_email, status, id] = params;
    const p = store.projects.find(p => p.id === id);
    if (!p) return { rows: [] };
    Object.assign(p, { name, location: location || '', start_date: start_date ? new Date(start_date) : null, end_date: end_date ? new Date(end_date) : null, manager_name, manager_phone: manager_phone || '', manager_email: manager_email || '', status: status || 'active' });
    return { rows: [p] };
  }
  if (s.startsWith('DELETE FROM PROJECTS WHERE ID')) {
    const idx = store.projects.findIndex(p => p.id === params[0]);
    if (idx !== -1) store.projects.splice(idx, 1);
    return { rows: [{ id: params[0] }] };
  }

  // ── worker_certifications ────────────────────────────────────────────────────
  if (s.startsWith('SELECT * FROM WORKER_CERTIFICATIONS') && s.includes('ORDER')) {
    return { rows: [...store.worker_certifications].sort((a, b) => b.created_at - a.created_at) };
  }
  if (s.includes('FROM WORKER_CERTIFICATIONS WHERE ID =')) {
    return { rows: store.worker_certifications.filter(c => c.id === params[0]) };
  }
  if (s.includes('FROM WORKER_CERTIFICATIONS WHERE WORKER_ID')) {
    return { rows: store.worker_certifications.filter(c => c.worker_id === params[0]) };
  }
  if (s.startsWith('INSERT INTO WORKER_CERTIFICATIONS')) {
    const [worker_id, cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes] = params;
    const row = { id: store._id.worker_certifications++, worker_id, cert_type, cert_number: cert_number || '', issuing_authority: issuing_authority || '', issue_date: issue_date ? new Date(issue_date) : null, expiry_date: expiry_date ? new Date(expiry_date) : null, notes: notes || '', created_at: new Date() };
    store.worker_certifications.push(row);
    _log('cert_added', `הסמכה: ${cert_type} — עובד #${worker_id}`, null, row.id, 'certification');
    return { rows: [row] };
  }
  if (s.startsWith('UPDATE WORKER_CERTIFICATIONS SET')) {
    const [cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes, id] = params;
    const c = store.worker_certifications.find(c => c.id === id);
    if (!c) return { rows: [] };
    Object.assign(c, { cert_type, cert_number: cert_number || '', issuing_authority: issuing_authority || '', issue_date: issue_date ? new Date(issue_date) : null, expiry_date: expiry_date ? new Date(expiry_date) : null, notes: notes || '' });
    return { rows: [c] };
  }
  if (s.startsWith('DELETE FROM WORKER_CERTIFICATIONS WHERE ID')) {
    const idx = store.worker_certifications.findIndex(c => c.id === params[0]);
    if (idx !== -1) store.worker_certifications.splice(idx, 1);
    return { rows: [{ id: params[0] }] };
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

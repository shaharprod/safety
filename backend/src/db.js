import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// ── In-memory demo store (used when no DATABASE_URL is configured) ──────────
const store = {
  subcontractors: [
    { id: 1, company_name: 'חברת א. ביצוע בע"מ', tax_id: '510123456', contact_phone: '054-1234567' }
  ],
  site_workers: [
    { id: 1, first_name: 'משה', last_name: 'לוי',  id_number: '123456789', subcontractor_id: 1, has_height_clearance: true,  last_training_date: new Date(Date.now() - 100 * 86_400_000) },
    { id: 2, first_name: 'שרה', last_name: 'כהן',  id_number: '987654321', subcontractor_id: 1, has_height_clearance: false, last_training_date: new Date(Date.now() - 400 * 86_400_000) }
  ],
  safety_hazards: [],
  site_access_logs: [],
  _nextId: { safety_hazards: 1, site_access_logs: 1 }
};

function memQuery(sql, params = []) {
  const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

  // GET /api/hazards
  if (s.startsWith('SELECT * FROM SAFETY_HAZARDS')) {
    return { rows: [...store.safety_hazards].sort((a, b) => b.created_at - a.created_at) };
  }
  // GET /api/hazards WHERE status='Open'
  if (s.includes('FROM SAFETY_HAZARDS WHERE STATUS')) {
    return { rows: store.safety_hazards.filter(h => h.status === 'Open') };
  }
  // INSERT hazard
  if (s.startsWith('INSERT INTO SAFETY_HAZARDS')) {
    const [description, image_url, supervisor_email, supervisor_name, severity] = params;
    const row = { id: store._nextId.safety_hazards++, description, image_url, supervisor_email, supervisor_name, severity, status: 'Open', created_at: new Date(), resolved_at: null };
    store.safety_hazards.push(row);
    return { rows: [row] };
  }
  // Worker lookup by id_number
  if (s.includes('FROM SITE_WORKERS WHERE ID_NUMBER')) {
    const worker = store.site_workers.find(w => w.id_number === params[0]);
    return { rows: worker ? [worker] : [] };
  }
  // GET /api/workers
  if (s.startsWith('SELECT * FROM SITE_WORKERS')) {
    return { rows: [...store.site_workers].sort((a, b) => a.last_name.localeCompare(b.last_name)) };
  }
  // INSERT access log
  if (s.startsWith('INSERT INTO SITE_ACCESS_LOGS')) {
    const [worker_id, access_status] = params;
    store.site_access_logs.push({ id: store._nextId.site_access_logs++, worker_id, access_status, check_in_time: new Date() });
    return { rows: [] };
  }
  return { rows: [] };
}

// ── Real pg pool (only when DATABASE_URL is set) ─────────────────────────────
const useReal = !!process.env.DATABASE_URL;
export const pool = useReal
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : { query: (sql, params) => Promise.resolve(memQuery(sql, params)) };

if (!useReal) {
  console.log('⚠️  No DATABASE_URL — running with in-memory demo store');
}

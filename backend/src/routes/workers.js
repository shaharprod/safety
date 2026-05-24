import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// ── Shared training check logic ───────────────────────────────────────────────
function calcAccess(worker) {
  const days = worker.last_training_date
    ? Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000)
    : Infinity;
  return {
    access_status: days <= 365 ? 'Allowed' : 'Denied_No_Training',
    days_since_training: days === Infinity ? null : days
  };
}

// ── Gate: check by ID number ──────────────────────────────────────────────────
router.post('/check', async (req, res) => {
  const { id_number } = req.body;
  if (!id_number) return res.status(400).json({ error: 'id_number is required' });

  const { rows } = await pool.query('SELECT * FROM site_workers WHERE id_number = $1', [id_number]);
  if (!rows.length) return res.status(404).json({ error: 'Worker not found' });

  const worker = rows[0];
  const { access_status, days_since_training } = calcAccess(worker);
  await pool.query('INSERT INTO site_access_logs (worker_id, access_status) VALUES ($1, $2)', [worker.id, access_status]);
  res.json({ worker, access_status, days_since_training });
});

// ── Gate: check by Google credential ─────────────────────────────────────────
router.post('/check-google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'credential is required' });

  let email, name;
  try {
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString());
    email = payload.email;
    name  = payload.name;
  } catch {
    return res.status(400).json({ error: 'Invalid credential' });
  }
  if (!email) return res.status(400).json({ error: 'Email not found in credential' });

  const { rows } = await pool.query('SELECT * FROM site_workers WHERE google_email = $1', [email]);
  if (!rows.length) return res.status(404).json({ error: `החשבון ${email} אינו רשום במערכת` });

  const worker = rows[0];
  const { access_status, days_since_training } = calcAccess(worker);
  await pool.query('INSERT INTO site_access_logs (worker_id, access_status) VALUES ($1, $2)', [worker.id, access_status]);
  res.json({ worker, access_status, days_since_training, google_name: name });
});

// ── Admin: list all workers ───────────────────────────────────────────────────
router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM site_workers ORDER BY last_name');
  res.json(rows);
});

// ── Admin: add worker ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { first_name, last_name, id_number, google_email, has_height_clearance, last_training_date, subcontractor_id } = req.body;
  if (!first_name || !last_name || !id_number) {
    return res.status(400).json({ error: 'first_name, last_name, id_number are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO site_workers (first_name, last_name, id_number, google_email, has_height_clearance, last_training_date, subcontractor_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [first_name, last_name, id_number, google_email || null, !!has_height_clearance,
     last_training_date || null, subcontractor_id || null]
  );
  res.status(201).json(rows[0]);
});

// ── Admin: update worker ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { first_name, last_name, id_number, google_email, has_height_clearance, last_training_date } = req.body;
  const { rows } = await pool.query(
    `UPDATE site_workers
     SET first_name=$1, last_name=$2, id_number=$3, google_email=$4,
         has_height_clearance=$5, last_training_date=$6
     WHERE id=$7 RETURNING *`,
    [first_name, last_name, id_number, google_email || null,
     !!has_height_clearance, last_training_date || null, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Worker not found' });
  res.json(rows[0]);
});

// ── Admin: delete worker ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows } = await pool.query('DELETE FROM site_workers WHERE id=$1 RETURNING id', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Worker not found' });
  res.json({ deleted: id });
});

export default router;

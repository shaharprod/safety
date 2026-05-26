import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/certifications
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM worker_certifications ORDER BY created_at DESC');
  res.json(rows);
});

// GET /api/certifications/worker/:workerId
router.get('/worker/:workerId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM worker_certifications WHERE worker_id = $1',
    [Number(req.params.workerId)]
  );
  res.json(rows);
});

// GET /api/certifications/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM worker_certifications WHERE id = $1', [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /api/certifications
router.post('/', async (req, res) => {
  const { worker_id, cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes } = req.body;
  if (!worker_id || !cert_type) return res.status(400).json({ error: 'worker_id and cert_type required' });
  const { rows } = await pool.query(
    'INSERT INTO worker_certifications (worker_id, cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [Number(worker_id), cert_type, cert_number || '', issuing_authority || '', issue_date || null, expiry_date || null, notes || '']
  );
  res.status(201).json(rows[0]);
});

// PUT /api/certifications/:id
router.put('/:id', async (req, res) => {
  const { cert_type, cert_number, issuing_authority, issue_date, expiry_date, notes } = req.body;
  const { rows } = await pool.query(
    'UPDATE worker_certifications SET cert_type = $1, cert_number = $2, issuing_authority = $3, issue_date = $4, expiry_date = $5, notes = $6 WHERE id = $7 RETURNING *',
    [cert_type, cert_number || '', issuing_authority || '', issue_date || null, expiry_date || null, notes || '', Number(req.params.id)]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// DELETE /api/certifications/:id
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM worker_certifications WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
});

export default router;

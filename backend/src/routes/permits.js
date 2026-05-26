import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const canWrite = [requireAuth, requireRole('safety_officer', 'admin')];

router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM company_permits ORDER BY expiry_date ASC NULLS LAST');
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM company_permits WHERE id = $1', [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', ...canWrite, async (req, res) => {
  const { title, permit_type, issuing_authority, issue_date, expiry_date, document_url, notes } = req.body;
  if (!title || !permit_type) return res.status(400).json({ error: 'title and permit_type required' });
  const { rows } = await pool.query(
    'INSERT INTO company_permits (title, permit_type, issuing_authority, issue_date, expiry_date, document_url, notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, permit_type, issuing_authority || '', issue_date || null, expiry_date || null, document_url || '', notes || '']
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', ...canWrite, async (req, res) => {
  const { title, permit_type, issuing_authority, issue_date, expiry_date, document_url, notes } = req.body;
  const { rows } = await pool.query(
    'UPDATE company_permits SET title=$1, permit_type=$2, issuing_authority=$3, issue_date=$4, expiry_date=$5, document_url=$6, notes=$7 WHERE id=$8 RETURNING *',
    [title, permit_type, issuing_authority || '', issue_date || null, expiry_date || null, document_url || '', notes || '', Number(req.params.id)]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.delete('/:id', ...canWrite, async (req, res) => {
  await pool.query('DELETE FROM company_permits WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
});

export default router;

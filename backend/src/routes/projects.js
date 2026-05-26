import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const canWrite = [requireAuth, requireRole('safety_officer', 'admin')];

// GET /api/projects
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  res.json(rows);
});

// POST /api/projects
router.post('/', ...canWrite, async (req, res) => {
  const { name, location, start_date, end_date, manager_name, manager_phone, manager_email, status } = req.body;
  if (!name || !manager_name) return res.status(400).json({ error: 'name and manager_name required' });
  const { rows } = await pool.query(
    'INSERT INTO projects (name, location, start_date, end_date, manager_name, manager_phone, manager_email, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [name, location || '', start_date || null, end_date || null, manager_name, manager_phone || '', manager_email || '', status || 'active']
  );
  res.status(201).json(rows[0]);
});

// PUT /api/projects/:id
router.put('/:id', ...canWrite, async (req, res) => {
  const { name, location, start_date, end_date, manager_name, manager_phone, manager_email, status } = req.body;
  const { rows } = await pool.query(
    'UPDATE projects SET name=$1, location=$2, start_date=$3, end_date=$4, manager_name=$5, manager_phone=$6, manager_email=$7, status=$8 WHERE id=$9 RETURNING *',
    [name, location || '', start_date || null, end_date || null, manager_name, manager_phone || '', manager_email || '', status || 'active', Number(req.params.id)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
  res.json(rows[0]);
});

// DELETE /api/projects/:id
router.delete('/:id', ...canWrite, async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
});

export default router;

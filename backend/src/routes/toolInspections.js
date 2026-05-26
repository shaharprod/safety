import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const canWrite = [requireAuth, requireRole('safety_officer', 'admin')];

// GET /api/tool-inspections
router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tool_inspections ORDER BY created_at DESC');
  res.json(rows);
});

// GET /api/tool-inspections/:id
router.get('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tool_inspections WHERE id = $1', [Number(req.params.id)]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /api/tool-inspections
router.post('/', ...canWrite, async (req, res) => {
  const { tool_type, inspector_name, location, expiry_date } = req.body;
  if (!tool_type || !inspector_name) return res.status(400).json({ error: 'tool_type and inspector_name required' });
  const { rows } = await pool.query(
    'INSERT INTO tool_inspections (tool_type, inspector_name, location, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *',
    [tool_type, inspector_name, location || '', expiry_date || null]
  );
  res.status(201).json(rows[0]);
});

// GET /api/tool-inspections/:id/items
router.get('/:id/items', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM tool_inspection_items WHERE inspection_id = $1',
    [Number(req.params.id)]
  );
  res.json(rows);
});

// POST /api/tool-inspections/:id/items
router.post('/:id/items', ...canWrite, async (req, res) => {
  const { tool_name, serial_number, condition, notes } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO tool_inspection_items (inspection_id, tool_name, serial_number, condition, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [Number(req.params.id), tool_name, serial_number || '', condition || 'pending', notes || '']
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/tool-inspections/:id/items/:itemId
router.patch('/:id/items/:itemId', ...canWrite, async (req, res) => {
  const { condition, notes, serial_number } = req.body;
  const { rows } = await pool.query(
    'UPDATE tool_inspection_items SET condition = $1, notes = $2, serial_number = $3 WHERE id = $4 RETURNING *',
    [condition, notes || '', serial_number !== undefined ? serial_number : '', Number(req.params.itemId)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Item not found' });
  res.json(rows[0]);
});

// DELETE /api/tool-inspections/:id/items/:itemId
router.delete('/:id/items/:itemId', ...canWrite, async (req, res) => {
  await pool.query('DELETE FROM tool_inspection_items WHERE id = $1', [Number(req.params.itemId)]);
  res.json({ ok: true });
});

// PATCH /api/tool-inspections/:id/close
router.patch('/:id/close', ...canWrite, async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE tool_inspections SET status = $1 WHERE id = $2 RETURNING *',
    ['Done', Number(req.params.id)]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Inspection not found' });
  res.json(rows[0]);
});

export default router;

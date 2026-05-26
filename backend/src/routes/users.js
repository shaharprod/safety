import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const officerOnly = [requireAuth, requireRole('safety_officer', 'admin')];

router.get('/', ...officerOnly, async (_, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, full_name, role, created_at FROM users ORDER BY id'
  );
  res.json(rows);
});

router.post('/', ...officerOnly, async (req, res) => {
  const { username, password, full_name, role } = req.body || {};
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'username, password, full_name and role required' });
  }
  if (!['foreman', 'safety_officer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be foreman, safety_officer, or admin' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role, created_at',
    [username, password_hash, full_name, role]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', ...officerOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { full_name, role, password } = req.body || {};
  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
  }
  if (full_name || role) {
    const { rows } = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), role = COALESCE($2, role) WHERE id = $3 RETURNING id, username, full_name, role',
      [full_name || null, role || null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    return res.json(rows[0]);
  }
  res.json({ ok: true });
});

router.delete('/:id', ...officerOnly, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
  res.json({ ok: true });
});

export default router;

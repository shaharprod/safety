import { Router } from 'express';
import { pool } from '../db.js';
import { uploadMiddleware } from '../services/upload.js';

const router = Router();

// POST /api/audits — create audit + seed its checklist items
router.post('/', async (req, res) => {
  const { audit_type, inspector_name, project_name, items } = req.body;
  if (!audit_type || !inspector_name) return res.status(400).json({ error: 'audit_type and inspector_name required' });

  const { rows } = await pool.query(
    'INSERT INTO safety_audits (audit_type, inspector_name, project_name) VALUES ($1, $2, $3) RETURNING *',
    [audit_type, inspector_name, project_name || '']
  );
  const audit = rows[0];

  if (Array.isArray(items)) {
    for (const item of items) {
      await pool.query(
        'INSERT INTO audit_items (audit_id, item_text, category, status, notes, photo_url) VALUES ($1,$2,$3,$4,$5,$6)',
        [audit.id, item.item_text, item.category || '', item.status || 'pending', item.notes || '', item.photo_url || null]
      );
    }
  }

  res.status(201).json(audit);
});

// GET /api/audits
router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM safety_audits ORDER BY created_at DESC');
  res.json(rows);
});

// GET /api/audits/:id/items
router.get('/:id/items', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM audit_items WHERE audit_id = $1', [Number(req.params.id)]);
  res.json(rows);
});

// PATCH /api/audits/:id/items/:itemId — update single item status/notes
router.patch('/:id/items/:itemId', (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { status, notes } = req.body;
    const photo_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    let sql, params;
    if (photo_url) {
      sql = 'UPDATE audit_items SET status=$1, notes=$2, photo_url=$3 WHERE id=$4 RETURNING *';
      params = [status, notes || '', photo_url, Number(req.params.itemId)];
    } else {
      sql = 'UPDATE audit_items SET status=$1, notes=$2 WHERE id=$3 RETURNING *';
      params = [status, notes || '', Number(req.params.itemId)];
    }
    const { rows } = await pool.query(sql, params);
    res.json(rows[0] || {});
  });
});

// PATCH /api/audits/:id/close
router.patch('/:id/close', async (req, res) => {
  const { rows } = await pool.query('UPDATE safety_audits SET status=$1 WHERE id=$2 RETURNING *', ['Done', Number(req.params.id)]);
  res.json(rows[0] || {});
});

export default router;

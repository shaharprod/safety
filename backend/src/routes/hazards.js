import { Router } from 'express';
import { pool } from '../db.js';
import { uploadMiddleware } from '../services/upload.js';
import { sendHazardAlert } from '../services/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/report', (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const { description, severity, supervisor_email, supervisor_name } = req.body;
    if (!description || !severity || !supervisor_email || !supervisor_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      `INSERT INTO safety_hazards (description, image_url, supervisor_email, supervisor_name, severity)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [description, imageUrl, supervisor_email, supervisor_name, severity]
    );

    const hazard = rows[0];

    sendHazardAlert({
      hazardId: hazard.id,
      description,
      severity,
      supervisorEmail: supervisor_email,
      supervisorName: supervisor_name,
      imageUrl
    }).catch(e => console.error('Email send failed:', e.message));

    res.status(201).json(hazard);
  });
});

router.get('/', async (_, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM safety_hazards ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status, treatment_notes, resolved_notes } = req.body || {};
  const role = req.user.role;

  const { rows } = await pool.query('SELECT * FROM safety_hazards WHERE id = $1', [id]);
  const hazard = rows[0];
  if (!hazard) return res.status(404).json({ error: 'Hazard not found' });

  if (status === 'In_Progress') {
    if (role !== 'foreman' && role !== 'safety_officer') {
      return res.status(403).json({ error: 'Only foreman or safety_officer can mark in-progress' });
    }
    if (hazard.status !== 'Open' && role !== 'safety_officer') {
      return res.status(400).json({ error: 'Can only mark Open hazards as In_Progress' });
    }
    const { rows: updated } = await pool.query(
      'UPDATE safety_hazards SET status = $1, treated_by_id = $2, treated_at = $3, treatment_notes = $4 WHERE id = $5 RETURNING *',
      [status, req.user.id, new Date(), treatment_notes || null, id]
    );
    await pool.query(
      'INSERT INTO activity_logs (action_type, description, user_name, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5)',
      ['hazard_status_updated', `מפגע #${id} — סומן בטיפול`, req.user.full_name || req.user.username, id, 'hazard']
    );
    return res.json(updated[0]);
  }

  if (status === 'Resolved') {
    if (role !== 'safety_officer') {
      return res.status(403).json({ error: 'Only safety_officer can resolve hazards' });
    }
    if (hazard.status !== 'In_Progress' && role !== 'safety_officer') {
      return res.status(400).json({ error: 'Can only resolve In_Progress hazards' });
    }
    const { rows: updated } = await pool.query(
      'UPDATE safety_hazards SET status = $1, resolved_by_id = $2, resolved_at = $3, resolved_notes = $4 WHERE id = $5 RETURNING *',
      [status, req.user.id, new Date(), resolved_notes || null, id]
    );
    await pool.query(
      'INSERT INTO activity_logs (action_type, description, user_name, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5)',
      ['hazard_status_updated', `מפגע #${id} — סומן טופל`, req.user.full_name || req.user.username, id, 'hazard']
    );
    return res.json(updated[0]);
  }

  return res.status(400).json({ error: 'Invalid status. Must be In_Progress or Resolved' });
});

export default router;

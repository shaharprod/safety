import { Router } from 'express';
import { pool } from '../db.js';
import { uploadMiddleware } from '../services/upload.js';

const router = Router();

router.post('/', (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const { incident_type, description, location, involved_parties, immediate_cause, root_cause, actions_taken, reporter_name } = req.body;
    if (!description || !reporter_name) return res.status(400).json({ error: 'description and reporter_name required' });

    const image_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

    const { rows } = await pool.query(
      `INSERT INTO safety_incidents
        (incident_type, description, location, involved_parties, immediate_cause, root_cause, actions_taken, image_url, reporter_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [incident_type || 'near_miss', description, location || '', involved_parties || '', immediate_cause || '', root_cause || '', actions_taken || '', image_url, reporter_name]
    );
    res.status(201).json(rows[0]);
  });
});

router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM safety_incidents ORDER BY created_at DESC');
  res.json(rows);
});

export default router;

import { Router } from 'express';
import { pool } from '../db.js';
import { uploadMiddleware } from '../services/upload.js';
import { sendHazardAlert } from '../services/email.js';

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

export default router;

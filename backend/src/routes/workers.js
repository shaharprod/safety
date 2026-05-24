import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.post('/check', async (req, res) => {
  const { id_number } = req.body;
  if (!id_number) return res.status(400).json({ error: 'id_number is required' });

  const { rows } = await pool.query(
    'SELECT * FROM site_workers WHERE id_number = $1',
    [id_number]
  );

  if (rows.length === 0) return res.status(404).json({ error: 'Worker not found' });

  const worker = rows[0];
  const daysSinceTraining = worker.last_training_date
    ? Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000)
    : Infinity;

  const access_status = daysSinceTraining <= 365 ? 'Allowed' : 'Denied_No_Training';

  await pool.query(
    'INSERT INTO site_access_logs (worker_id, access_status) VALUES ($1, $2)',
    [worker.id, access_status]
  );

  res.json({ worker, access_status, days_since_training: daysSinceTraining === Infinity ? null : daysSinceTraining });
});

// Google Sign-In: decode JWT payload from Google, look up worker by google_email
router.post('/check-google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'credential is required' });

  // Decode JWT payload (not verifying signature — fine for demo; use google-auth-library for production)
  let email, name;
  try {
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64url').toString());
    email = payload.email;
    name  = payload.name;
  } catch {
    return res.status(400).json({ error: 'Invalid credential' });
  }

  if (!email) return res.status(400).json({ error: 'Email not found in credential' });

  const { rows } = await pool.query(
    'SELECT * FROM site_workers WHERE google_email = $1',
    [email]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: `החשבון ${email} אינו רשום במערכת` });
  }

  const worker = rows[0];
  const daysSinceTraining = worker.last_training_date
    ? Math.floor((Date.now() - new Date(worker.last_training_date).getTime()) / 86_400_000)
    : Infinity;

  const access_status = daysSinceTraining <= 365 ? 'Allowed' : 'Denied_No_Training';

  await pool.query(
    'INSERT INTO site_access_logs (worker_id, access_status) VALUES ($1, $2)',
    [worker.id, access_status]
  );

  res.json({ worker, access_status, days_since_training: daysSinceTraining === Infinity ? null : daysSinceTraining, google_name: name });
});

router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM site_workers ORDER BY last_name');
  res.json(rows);
});

export default router;

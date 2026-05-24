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

router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM site_workers ORDER BY last_name');
  res.json(rows);
});

export default router;

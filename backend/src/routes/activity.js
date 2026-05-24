import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC');
  res.json(rows);
});

export default router;

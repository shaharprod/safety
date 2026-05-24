import { Router } from 'express';
import { pool } from '../db.js';
import { generateHazardsPDF } from '../services/pdf.js';

const router = Router();

router.get('/pdf', async (_, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM safety_hazards WHERE status = 'Open' ORDER BY created_at DESC"
  );

  const buffer = await generateHazardsPDF(rows);

  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="hazards-report-${date}.pdf"`);
  res.send(buffer);
});

export default router;

import { Router } from 'express';
import { pool } from '../db.js';
import { generateHazardsPDF, generateIncidentsPDF, generateAuditPDF } from '../services/pdf.js';

const router = Router();

function sendPDF(res, buffer, filename, inline = false) {
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${filename}-${date}.pdf"`);
  res.send(buffer);
}

// GET /api/reports/hazards?inline=1
router.get('/hazards', async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM safety_hazards WHERE status = 'Open' ORDER BY created_at DESC"
  );
  const buf = await generateHazardsPDF(rows);
  sendPDF(res, buf, 'hazards-report', !!req.query.inline);
});

// GET /api/reports/incidents?inline=1
router.get('/incidents', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM safety_incidents ORDER BY created_at DESC'
  );
  const buf = await generateIncidentsPDF(rows);
  sendPDF(res, buf, 'incidents-report', !!req.query.inline);
});

// GET /api/reports/audit/:id?inline=1
router.get('/audit/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rows: audits } = await pool.query('SELECT * FROM safety_audits WHERE id = $1', [id]);
  if (!audits.length) return res.status(404).json({ error: 'Audit not found' });
  const { rows: items } = await pool.query('SELECT * FROM audit_items WHERE audit_id = $1', [id]);
  const buf = await generateAuditPDF(audits[0], items);
  sendPDF(res, buf, `audit-${id}`, !!req.query.inline);
});

// Legacy alias kept for backward compat
router.get('/pdf', async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM safety_hazards WHERE status = 'Open' ORDER BY created_at DESC"
  );
  const buf = await generateHazardsPDF(rows);
  sendPDF(res, buf, 'hazards-report', false);
});

export default router;

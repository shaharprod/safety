import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendDirectiveAssigned, sendDirectiveUpdate, sendProjectBriefing } from '../services/email.js';

const router = Router();
const canIssue = [requireAuth, requireRole('safety_officer', 'admin')];

function appUrlFrom(req) {
  return process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
}

async function logActivity(action_type, description, userName, refId) {
  try {
    await pool.query(
      'INSERT INTO activity_logs (action_type, description, user_name, reference_id, reference_type) VALUES ($1,$2,$3,$4,$5)',
      [action_type, description, userName || null, refId || null, 'directive']
    );
  } catch (e) { console.error('activity log failed:', e.message); }
}

// GET /api/coordination?project_id=  — list directives (optionally one project)
router.get('/', requireAuth, async (req, res) => {
  const { project_id } = req.query;
  const params = [];
  let where = '';
  if (project_id) { params.push(Number(project_id)); where = 'WHERE d.project_id = $1'; }
  const { rows } = await pool.query(
    `SELECT d.*, p.name AS project_name, p.manager_name, p.manager_email
       FROM safety_directives d
       LEFT JOIN projects p ON p.id = d.project_id
       ${where}
       ORDER BY (d.status = 'closed'), d.created_at DESC`,
    params
  );
  res.json(rows);
});

// GET /api/coordination/summary — open/overdue counts grouped by project
router.get('/summary', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT project_id,
      COUNT(*) FILTER (WHERE status <> 'closed')                                            AS open_total,
      COUNT(*) FILTER (WHERE status = 'open')                                               AS awaiting,
      COUNT(*) FILTER (WHERE status = 'reported')                                           AS pending_verify,
      COUNT(*) FILTER (WHERE status <> 'closed' AND due_date IS NOT NULL AND due_date < CURRENT_DATE) AS overdue
    FROM safety_directives
    GROUP BY project_id
  `);
  const map = {};
  for (const r of rows) map[r.project_id] = {
    open_total: Number(r.open_total), awaiting: Number(r.awaiting),
    pending_verify: Number(r.pending_verify), overdue: Number(r.overdue),
  };
  res.json(map);
});

// POST /api/coordination — safety officer issues a directive → emails the manager
router.post('/', ...canIssue, async (req, res) => {
  const { project_id, title, description, category, priority, due_date } = req.body || {};
  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title required' });

  const { rows: projRows } = await pool.query('SELECT * FROM projects WHERE id = $1', [Number(project_id)]);
  const project = projRows[0];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const issuedBy = req.user.full_name || req.user.username;
  const { rows } = await pool.query(
    `INSERT INTO safety_directives
       (project_id, title, description, category, priority, due_date, issued_by, assignee_name, assignee_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [Number(project_id), title, description || '', category || 'אחר', priority || 'medium',
     due_date || null, issuedBy, project.manager_name || '', project.manager_email || '']
  );
  const directive = rows[0];

  await logActivity('directive_issued', `הנחיית בטיחות "${title}" הוקצתה ל${project.manager_name || 'מנהל הפרויקט'} בפרויקט ${project.name}`, issuedBy, directive.id);

  sendDirectiveAssigned({ directive, projectName: project.name, appUrl: appUrlFrom(req) })
    .catch(e => console.error('Directive email failed:', e.message));

  res.status(201).json({ ...directive, project_name: project.name });
});

// PATCH /api/coordination/:id/status — advance the lifecycle
//   acknowledge / report  → done by foreman (manager) or safety officer
//   close                 → safety officer / admin only
router.patch('/:id/status', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status, note } = req.body || {};
  const role = req.user.role;
  const actor = req.user.full_name || req.user.username;

  const { rows } = await pool.query(
    `SELECT d.*, p.name AS project_name, p.manager_email
       FROM safety_directives d LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = $1`, [id]);
  const d = rows[0];
  if (!d) return res.status(404).json({ error: 'Directive not found' });

  const officerEmail = process.env.SAFETY_OFFICER_EMAIL || process.env.SMTP_USER;

  if (status === 'acknowledged') {
    const { rows: up } = await pool.query(
      `UPDATE safety_directives SET status='acknowledged', acknowledged_at=COALESCE(acknowledged_at, NOW()), updated_at=NOW() WHERE id=$1 RETURNING *`, [id]);
    await logActivity('directive_acknowledged', `הנחיה #${id} — אושרה קבלה ע״י ${actor}`, actor, id);
    sendDirectiveUpdate({ directive: up[0], projectName: d.project_name, toEmail: officerEmail, kind: 'acknowledged', actorName: actor })
      .catch(e => console.error('email failed:', e.message));
    return res.json(up[0]);
  }

  if (status === 'reported') {
    const { rows: up } = await pool.query(
      `UPDATE safety_directives SET status='reported', report_notes=$2, reported_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id, note || null]);
    await logActivity('directive_reported', `הנחיה #${id} — דווח ביצוע ע״י ${actor}`, actor, id);
    sendDirectiveUpdate({ directive: up[0], projectName: d.project_name, toEmail: officerEmail, kind: 'reported', actorName: actor })
      .catch(e => console.error('email failed:', e.message));
    return res.json(up[0]);
  }

  if (status === 'closed') {
    if (role !== 'safety_officer' && role !== 'admin') {
      return res.status(403).json({ error: 'Only the safety officer can verify and close a directive' });
    }
    const { rows: up } = await pool.query(
      `UPDATE safety_directives SET status='closed', close_notes=$2, closed_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id, note || null]);
    await logActivity('directive_closed', `הנחיה #${id} — אומתה ונסגרה ע״י ${actor}`, actor, id);
    return res.json(up[0]);
  }

  return res.status(400).json({ error: 'Invalid status. Use acknowledged | reported | closed' });
});

// PUT /api/coordination/:id — edit directive details
router.put('/:id', ...canIssue, async (req, res) => {
  const { title, description, category, priority, due_date } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE safety_directives SET title=$1, description=$2, category=$3, priority=$4, due_date=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
    [title, description || '', category || 'אחר', priority || 'medium', due_date || null, Number(req.params.id)]);
  if (!rows[0]) return res.status(404).json({ error: 'Directive not found' });
  res.json(rows[0]);
});

// DELETE /api/coordination/:id
router.delete('/:id', ...canIssue, async (req, res) => {
  await pool.query('DELETE FROM safety_directives WHERE id = $1', [Number(req.params.id)]);
  res.json({ ok: true });
});

// POST /api/coordination/briefing — send the project manager a consolidated digest
router.post('/briefing', ...canIssue, async (req, res) => {
  const { project_id, message } = req.body || {};
  const { rows: projRows } = await pool.query('SELECT * FROM projects WHERE id = $1', [Number(project_id)]);
  const project = projRows[0];
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!project.manager_email) return res.status(400).json({ error: 'לפרויקט אין כתובת מייל של מנהל אחראי' });

  const { rows: directives } = await pool.query(
    'SELECT * FROM safety_directives WHERE project_id = $1 ORDER BY due_date NULLS LAST', [Number(project_id)]);
  const { rows: hz } = await pool.query(`SELECT COUNT(*)::int AS c FROM safety_hazards WHERE status <> 'Resolved'`);

  try {
    await sendProjectBriefing({ project, directives, openHazards: hz[0]?.c || 0, message, appUrl: appUrlFrom(req) });
    await logActivity('briefing_sent', `נשלח תדריך בטיחות ל${project.manager_name} בפרויקט ${project.name}`, req.user.full_name || req.user.username, Number(project_id));
    res.json({ ok: true, sentTo: project.manager_email });
  } catch (e) {
    console.error('Briefing email failed:', e.message);
    res.status(502).json({ error: 'שליחת המייל נכשלה — בדוק הגדרות SMTP' });
  }
});

export default router;

import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const { rows: certRows } = await pool.query(`
    SELECT
      'cert'                                        AS type,
      wc.worker_id,
      sw.first_name || ' ' || sw.last_name         AS worker_name,
      wc.cert_type                                  AS label,
      wc.expiry_date::date                          AS expiry_date,
      (wc.expiry_date::date - CURRENT_DATE)::int    AS days_left
    FROM worker_certifications wc
    JOIN site_workers sw ON sw.id = wc.worker_id
    WHERE wc.expiry_date IS NOT NULL
      AND wc.expiry_date::date <= CURRENT_DATE + INTERVAL '90 days'
  `);

  const { rows: trainingRows } = await pool.query(`
    SELECT
      'training'                                                  AS type,
      sw.id                                                       AS worker_id,
      sw.first_name || ' ' || sw.last_name                       AS worker_name,
      'הדרכת בטיחות'                                              AS label,
      (sw.last_training_date + INTERVAL '365 days')::date        AS expiry_date,
      ((sw.last_training_date + INTERVAL '365 days')::date
        - CURRENT_DATE)::int                                      AS days_left
    FROM site_workers sw
    WHERE sw.last_training_date IS NOT NULL
      AND sw.last_training_date <= CURRENT_DATE - INTERVAL '275 days'
    UNION ALL
    SELECT
      'training'                           AS type,
      sw.id                                AS worker_id,
      sw.first_name || ' ' || sw.last_name AS worker_name,
      'הדרכת בטיחות — חסרה'               AS label,
      NULL                                 AS expiry_date,
      -9999                                AS days_left
    FROM site_workers sw
    WHERE sw.last_training_date IS NULL
  `);

  const items = [...certRows, ...trainingRows]
    .map(r => ({
      ...r,
      days_left: Number(r.days_left),
      urgency: r.days_left < 0 ? 'expired' : r.days_left <= 30 ? 'soon30' : 'soon90',
    }))
    .sort((a, b) => a.days_left - b.days_left);

  const summary = {
    expired: items.filter(i => i.urgency === 'expired').length,
    soon30:  items.filter(i => i.urgency === 'soon30').length,
    soon90:  items.filter(i => i.urgency === 'soon90').length,
  };

  res.json({ summary, items });
});

export default router;

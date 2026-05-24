import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import hazardsRouter from './routes/hazards.js';
import workersRouter from './routes/workers.js';
import reportsRouter from './routes/reports.js';
import auditsRouter from './routes/audits.js';
import incidentsRouter from './routes/incidents.js';
import activityRouter from './routes/activity.js';
import toolInspectionsRouter from './routes/toolInspections.js';
import projectsRouter from './routes/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/hazards', hazardsRouter);
app.use('/api/gate', workersRouter);
app.use('/api/workers', workersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audits', auditsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/tool-inspections', toolInspectionsRouter);
app.use('/api/projects', projectsRouter);

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`SafetyOS API running on port ${PORT}`));
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

vi.mock('../src/db.js', () => ({
  pool: { query: vi.fn() }
}));

import { pool } from '../src/db.js';
import app from '../src/index.js';

const hash = bcrypt.hashSync('1234', 10);
const officer = { id: 1, username: 'admin', password_hash: hash, full_name: 'ממונה בטיחות', role: 'safety_officer' };
const foreman = { id: 2, username: 'foreman1', password_hash: hash, full_name: 'מנהל עבודה', role: 'foreman' };
const openHazard = { id: 1, status: 'Open', description: 'test', treated_by_id: null, treated_at: null };
const inProgressHazard = { id: 1, status: 'In_Progress', description: 'test', treated_by_id: 2, treated_at: new Date() };

async function getToken(user) {
  pool.query.mockResolvedValueOnce({ rows: [user] });
  const res = await request(app).post('/api/auth/login').send({ username: user.username, password: '1234' });
  return res.body.token;
}

beforeEach(() => vi.clearAllMocks());

describe('PATCH /api/hazards/:id/status', () => {
  it('foreman can mark Open hazard as In_Progress', async () => {
    const token = await getToken(foreman);
    pool.query
      .mockResolvedValueOnce({ rows: [openHazard] })
      .mockResolvedValueOnce({ rows: [{ ...openHazard, status: 'In_Progress', treated_by_id: 2 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In_Progress', treatment_notes: 'בטיפול' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In_Progress');
  });

  it('safety_officer can mark In_Progress as Resolved', async () => {
    const token = await getToken(officer);
    pool.query
      .mockResolvedValueOnce({ rows: [inProgressHazard] })
      .mockResolvedValueOnce({ rows: [{ ...inProgressHazard, status: 'Resolved', resolved_by_id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Resolved', resolved_notes: 'טופל' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Resolved');
  });

  it('foreman cannot resolve a hazard', async () => {
    const token = await getToken(foreman);
    pool.query.mockResolvedValueOnce({ rows: [inProgressHazard] });
    const res = await request(app)
      .patch('/api/hazards/1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Resolved', resolved_notes: 'x' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for unknown hazard', async () => {
    const token = await getToken(foreman);
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/hazards/99/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In_Progress', treatment_notes: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/hazards/1/status').send({ status: 'In_Progress' });
    expect(res.status).toBe(401);
  });
});

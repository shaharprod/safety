import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

vi.mock('../src/db.js', () => ({
  pool: { query: vi.fn() }
}));

import { pool } from '../src/db.js';
import app from '../src/index.js';

const hash = bcrypt.hashSync('1234', 10);
const seedUser = { id: 1, username: 'admin', password_hash: hash, full_name: 'ממונה בטיחות', role: 'safety_officer' };

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: '1234' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('safety_officer');
  });

  it('returns 401 on wrong password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ username: 'nobody', password: '1234' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    // First get a token
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: '1234' });
    const token = loginRes.body.token;

    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'admin', full_name: 'ממונה בטיחות', role: 'safety_officer' }] });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('admin');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/auth/password', () => {
  it('changes password with correct current password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: '1234' });
    const token = loginRes.body.token;

    pool.query
      .mockResolvedValueOnce({ rows: [seedUser] })
      .mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: '1234', newPassword: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 401 with wrong current password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [seedUser] });
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: '1234' });
    const token = loginRes.body.token;

    pool.query
      .mockResolvedValueOnce({ rows: [seedUser] })
      .mockResolvedValueOnce({ rows: [seedUser] });
    const res = await request(app)
      .patch('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrong', newPassword: 'newpass' });
    expect(res.status).toBe(401);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/auth/password').send({ currentPassword: '1234', newPassword: 'x' });
    expect(res.status).toBe(401);
  });
});

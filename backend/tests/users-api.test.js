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

async function getToken() {
  pool.query.mockResolvedValueOnce({ rows: [seedUser] });
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: '1234' });
  return res.body.token;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/users', () => {
  it('returns users list for safety_officer', async () => {
    const token = await getToken();
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, username: 'admin', full_name: 'ממונה בטיחות', role: 'safety_officer', created_at: new Date() }] });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const token = await getToken();
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, username: 'foreman1', full_name: 'מנהל עבודה', role: 'foreman', created_at: new Date() }] });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'foreman1', password: 'pass', full_name: 'מנהל עבודה', role: 'foreman' });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('foreman1');
  });

  it('returns 400 for missing fields', async () => {
    const token = await getToken();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes another user', async () => {
    const token = await getToken();
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/users/2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('cannot delete self', async () => {
    const token = await getToken();
    const res = await request(app)
      .delete('/api/users/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

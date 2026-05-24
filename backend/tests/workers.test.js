import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/db.js', () => ({
  pool: { query: vi.fn() }
}));

import { pool } from '../src/db.js';
import app from '../src/index.js';

beforeEach(() => vi.clearAllMocks());

describe('POST /api/gate/check', () => {
  it('allows worker with valid training (100 days)', async () => {
    const trainingDate = new Date(Date.now() - 100 * 86_400_000);
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'משה', last_name: 'לוי', id_number: '123456789', last_training_date: trainingDate }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/gate/check').send({ id_number: '123456789' });
    expect(res.status).toBe(200);
    expect(res.body.access_status).toBe('Allowed');
    expect(res.body.days_since_training).toBeLessThanOrEqual(365);
  });

  it('denies worker with expired training (400 days)', async () => {
    const trainingDate = new Date(Date.now() - 400 * 86_400_000);
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 2, first_name: 'שרה', last_name: 'כהן', id_number: '987654321', last_training_date: trainingDate }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/gate/check').send({ id_number: '987654321' });
    expect(res.status).toBe(200);
    expect(res.body.access_status).toBe('Denied_No_Training');
  });

  it('returns 404 for unknown worker', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/gate/check').send({ id_number: '000000000' });
    expect(res.status).toBe(404);
  });
});

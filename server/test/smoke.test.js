import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('smoke', () => {
  it('health check responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('can register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'smoke@example.com', password: 'password123', name: 'Smoke Test' });
    expect(res.status).toBe(201);
    expect(res.body.user.credits).toBe(100);
  });
});

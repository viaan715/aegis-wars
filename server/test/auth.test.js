import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser, uniqueEmail } from './helpers.js';

describe('auth', () => {
  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: 'short', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail(), password: 'password123', name: '  ' });
    expect(res.status).toBe(400);
  });

  it('registers with 100 starter credits and free plan', async () => {
    const { user } = await registerUser();
    expect(user.plan).toBe('free');
    expect(user.credits).toBe(100);
  });

  it('rejects duplicate email', async () => {
    const email = uniqueEmail();
    await registerUser({ email });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Again' });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const email = uniqueEmail();
    await registerUser({ email });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    const email = uniqueEmail();
    await registerUser({ email });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('rejects login for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: uniqueEmail(), password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('/me requires a valid token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('/me returns the authenticated user', async () => {
    const { token, user } = await registerUser();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

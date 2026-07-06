import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser } from './helpers.js';

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('billing', () => {
  it('lists plans', async () => {
    const res = await request(app).get('/api/billing/plans');
    expect(res.status).toBe(200);
    expect(res.body.plans.map((p) => p.id)).toEqual(['free', 'pro']);
  });

  it('upgrades to pro without touching the credit balance', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/billing/upgrade').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.plan).toBe('pro');
    expect(res.body.user.credits).toBe(100);
  });

  it('downgrades back to free', async () => {
    const { token } = await registerUser();
    await request(app).post('/api/billing/upgrade').set(auth(token));
    const res = await request(app).post('/api/billing/downgrade').set(auth(token));
    expect(res.body.user.plan).toBe('free');
  });
});

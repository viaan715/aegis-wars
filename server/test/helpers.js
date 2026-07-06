import request from 'supertest';
import { app } from '../src/app.js';

let counter = 0;
export function uniqueEmail() {
  counter += 1;
  return `user${counter}-${Date.now()}@example.com`;
}

export async function registerUser(overrides = {}) {
  const email = overrides.email ?? uniqueEmail();
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Test User', ...overrides, email });
  return { token: res.body.token, user: res.body.user };
}

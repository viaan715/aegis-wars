import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser } from './helpers.js';

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// No ANTHROPIC_API_KEY is set in the test environment, so aiClient.js's
// `anthropic` client is always null here — these tests cover the "not
// configured" path, which is also exactly what a real deployment shows
// before an API key is set.
describe('ai routes without an API key configured', () => {
  it('generate-form returns a friendly 503 and does not charge credits', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/ai/generate-form').set(auth(token)).send({ prompt: 'a feedback survey' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('AI_UNAVAILABLE');

    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.body.user.credits).toBe(100);
  });

  it('improve-question returns a friendly 503 and does not charge credits', async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post('/api/ai/improve-question')
      .set(auth(token))
      .send({ label: 'whats ur name', description: '', type: 'short_text' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('AI_UNAVAILABLE');

    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.body.user.credits).toBe(100);
  });

  it('does not create an orphaned form when generation is unavailable', async () => {
    const { token } = await registerUser();
    await request(app).post('/api/ai/generate-form').set(auth(token)).send({ prompt: 'a feedback survey' });
    const res = await request(app).get('/api/forms').set(auth(token));
    expect(res.body.forms).toHaveLength(0);
  });
});

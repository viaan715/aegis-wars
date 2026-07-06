import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser } from './helpers.js';

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function publishedForm(token, questions) {
  const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Survey' });
  await request(app).put(`/api/forms/${created.body.form.id}`).set(auth(token)).send({ questions });
  const published = await request(app).post(`/api/forms/${created.body.form.id}/publish`).set(auth(token));
  return published.body.form;
}

describe('public fill + responses', () => {
  it('404s for an unknown slug', async () => {
    const res = await request(app).get('/api/public/forms/not-a-real-slug');
    expect(res.status).toBe(404);
  });

  it('404s for a draft (unpublished) form', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Draft' });
    const res = await request(app).get(`/api/public/forms/${created.body.form.slug}`);
    expect(res.status).toBe(404);
  });

  it('serves a published form without leaking owner-only fields', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [
      { type: 'short_text', label: 'Name', description: '', options: [], required: true },
    ]);
    const res = await request(app).get(`/api/public/forms/${form.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.form.id).toBeDefined();
    expect(res.body.form.status).toBeUndefined();
    expect(res.body.questions[0].label).toBe('Name');
  });

  it('rejects a submission missing a required answer', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [
      { type: 'short_text', label: 'Name', description: '', options: [], required: true },
    ]);
    const res = await request(app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .field('answers', JSON.stringify({}));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid multiple-choice selection', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [
      { type: 'multiple_choice', label: 'Color', description: '', options: ['Red', 'Blue'], required: true },
    ]);
    const questions = (await request(app).get(`/api/public/forms/${form.slug}`)).body.questions;
    const res = await request(app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .field('answers', JSON.stringify({ [questions[0].id]: 'Not a real option' }));
    expect(res.status).toBe(400);
  });

  it('accepts a valid submission and charges the owner 1 credit', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [
      { type: 'short_text', label: 'Name', description: '', options: [], required: true },
    ]);
    const questions = (await request(app).get(`/api/public/forms/${form.slug}`)).body.questions;

    const res = await request(app)
      .post(`/api/public/forms/${form.slug}/responses`)
      .field('answers', JSON.stringify({ [questions[0].id]: 'Jane' }));
    expect(res.status).toBe(201);

    const me = await request(app).get('/api/auth/me').set(auth(token));
    // 100 - 5 (create form) - 5 (publish needs questions, set via PUT which is free) - 1 (response) = 94
    expect(me.body.user.credits).toBe(94);
  });

  it('does not charge credits for a rejected (invalid) submission', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [
      { type: 'short_text', label: 'Name', description: '', options: [], required: true },
    ]);
    const before = await request(app).get('/api/auth/me').set(auth(token));

    await request(app).post(`/api/public/forms/${form.slug}/responses`).field('answers', JSON.stringify({}));

    const after = await request(app).get('/api/auth/me').set(auth(token));
    expect(after.body.user.credits).toBe(before.body.user.credits);
  });

  it('stops accepting responses once the owner is out of credits', async () => {
    const { token } = await registerUser();
    const form = await publishedForm(token, [{ type: 'short_text', label: 'Name', description: '', options: [], required: false }]);

    // Burn the owner down to 0 credits by creating throwaway forms (5 each, started at 95 after create+publish-questions).
    for (let i = 0; i < 19; i += 1) {
      await request(app).post('/api/forms').set(auth(token)).send({ title: `Filler ${i}` });
    }
    const before = await request(app).get('/api/auth/me').set(auth(token));
    expect(before.body.user.credits).toBe(0);

    const res = await request(app).post(`/api/public/forms/${form.slug}/responses`).field('answers', JSON.stringify({}));
    expect(res.status).toBe(403);
  });
});

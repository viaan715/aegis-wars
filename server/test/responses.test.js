import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser } from './helpers.js';

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function setupPublishedFormWithResponse() {
  const { token } = await registerUser();
  const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Survey' });
  const formId = created.body.form.id;
  await request(app)
    .put(`/api/forms/${formId}`)
    .set(auth(token))
    .send({
      questions: [
        { type: 'short_text', label: 'Name', description: '', options: [], required: true },
        { type: 'rating', label: 'Rating', description: '', options: [], required: false },
      ],
    });
  const published = await request(app).post(`/api/forms/${formId}/publish`).set(auth(token));
  const slug = published.body.form.slug;
  const questions = (await request(app).get(`/api/public/forms/${slug}`)).body.questions;

  await request(app)
    .post(`/api/public/forms/${slug}/responses`)
    .field('answers', JSON.stringify({ [questions[0].id]: 'Jane', [questions[1].id]: 4 }));

  return { token, formId, questions };
}

describe('responses + analytics', () => {
  it('lists submitted responses with parsed answer values', async () => {
    const { token, formId } = await setupPublishedFormWithResponse();
    const res = await request(app).get(`/api/forms/${formId}/responses`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.responses).toHaveLength(1);
    expect(res.body.responses[0].answers.map((a) => a.value)).toContain('Jane');
    expect(typeof res.body.responses[0].submittedAt).toBe('string');
  });

  it('computes analytics distributions and averages', async () => {
    const { token, formId } = await setupPublishedFormWithResponse();
    const res = await request(app).get(`/api/forms/${formId}/analytics`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.totalResponses).toBe(1);
    const rating = res.body.questions.find((q) => q.label === 'Rating');
    expect(rating.average).toBe(4);
    const name = res.body.questions.find((q) => q.label === 'Name');
    expect(name.sampleValues).toContain('Jane');
  });

  it('exports a clean CSV with ISO timestamps', async () => {
    const { token, formId } = await setupPublishedFormWithResponse();
    const res = await request(app).get(`/api/forms/${formId}/responses/export.csv`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('Response ID,Submitted At,Name,Rating');
    // Regression check: Postgres Date objects must be formatted as ISO strings,
    // not JS's verbose Date#toString() output.
    expect(lines[1]).toMatch(/^\d+,\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z,Jane,4$/);
  });

  it('404s analytics for a form you do not own', async () => {
    const { formId } = await setupPublishedFormWithResponse();
    const { token: otherToken } = await registerUser();
    const res = await request(app).get(`/api/forms/${formId}/analytics`).set(auth(otherToken));
    expect(res.status).toBe(404);
  });
});

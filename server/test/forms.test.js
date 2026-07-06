import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser } from './helpers.js';

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('forms', () => {
  it('creates a form and charges 5 credits', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/forms').set(auth(token)).send({ title: 'My Form', description: 'desc' });
    expect(res.status).toBe(201);
    expect(res.body.form.title).toBe('My Form');
    expect(res.body.questions).toEqual([]);

    const me = await request(app).get('/api/auth/me').set(auth(token));
    expect(me.body.user.credits).toBe(95);
  });

  it('defaults an untitled form when title is blank', async () => {
    const { token } = await registerUser();
    const res = await request(app).post('/api/forms').set(auth(token)).send({});
    expect(res.body.form.title).toBe('Untitled form');
  });

  it('rejects create when credits are insufficient', async () => {
    const { token, user } = await registerUser();
    // Burn credits down below the create-form cost via repeated cheap-ish creates.
    for (let i = 0; i < 19; i += 1) {
      await request(app).post('/api/forms').set(auth(token)).send({ title: `Form ${i}` });
    }
    // 100 - 19*5 = 5 credits left, exactly enough for one more.
    const okRes = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Last one' });
    expect(okRes.status).toBe(201);

    const res = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Should fail' });
    expect(res.status).toBe(402);
    expect(res.body.code).toBe('INSUFFICIENT_CREDITS');
  });

  it('pro plan bypasses credit charges entirely', async () => {
    const { token } = await registerUser();
    await request(app).post('/api/billing/upgrade').set(auth(token));
    // Drain to 0 credits isn't possible via API once pro, so just confirm creation succeeds
    // regardless — pro accounts never get charged.
    const before = await request(app).get('/api/auth/me').set(auth(token));
    await request(app).post('/api/forms').set(auth(token)).send({ title: 'Pro form' });
    const after = await request(app).get('/api/auth/me').set(auth(token));
    expect(after.body.user.credits).toBe(before.body.user.credits);
  });

  it('lists only the owner forms', async () => {
    const a = await registerUser();
    const b = await registerUser();
    await request(app).post('/api/forms').set(auth(a.token)).send({ title: 'A form' });
    await request(app).post('/api/forms').set(auth(b.token)).send({ title: 'B form' });

    const res = await request(app).get('/api/forms').set(auth(a.token));
    expect(res.body.forms).toHaveLength(1);
    expect(res.body.forms[0].title).toBe('A form');
  });

  it('404s getting a form you do not own', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(a.token)).send({ title: 'A form' });
    const res = await request(app).get(`/api/forms/${created.body.form.id}`).set(auth(b.token));
    expect(res.status).toBe(404);
  });

  it('updates a form and replaces its questions', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    const formId = created.body.form.id;

    const update = await request(app)
      .put(`/api/forms/${formId}`)
      .set(auth(token))
      .send({
        title: 'Updated title',
        questions: [{ type: 'short_text', label: 'Name', description: '', options: [], required: true }],
      });

    expect(update.status).toBe(200);
    expect(update.body.form.title).toBe('Updated title');
    expect(update.body.questions).toHaveLength(1);
    expect(update.body.questions[0].required).toBe(true);
  });

  it('rejects an unknown question type', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    const res = await request(app)
      .put(`/api/forms/${created.body.form.id}`)
      .set(auth(token))
      .send({ questions: [{ type: 'not_a_real_type', label: 'X' }] });
    expect(res.status).toBe(400);
  });

  it('rejects a question with no label', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    const res = await request(app)
      .put(`/api/forms/${created.body.form.id}`)
      .set(auth(token))
      .send({ questions: [{ type: 'short_text', label: '   ' }] });
    expect(res.status).toBe(400);
  });

  it('duplicates a form with its questions and charges 5 credits', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Original' });
    await request(app)
      .put(`/api/forms/${created.body.form.id}`)
      .set(auth(token))
      .send({ questions: [{ type: 'short_text', label: 'Name', description: '', options: [], required: true }] });

    const dup = await request(app).post(`/api/forms/${created.body.form.id}/duplicate`).set(auth(token));
    expect(dup.status).toBe(201);
    expect(dup.body.form.title).toBe('Original (copy)');
    expect(dup.body.questions).toHaveLength(1);
    expect(dup.body.questions[0].label).toBe('Name');

    const me = await request(app).get('/api/auth/me').set(auth(token));
    // 100 - 5 (create) - 5 (duplicate) = 90
    expect(me.body.user.credits).toBe(90);
  });

  it('deletes a form', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    const del = await request(app).delete(`/api/forms/${created.body.form.id}`).set(auth(token));
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/forms/${created.body.form.id}`).set(auth(token));
    expect(get.status).toBe(404);
  });

  it('refuses to publish a form with no questions', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    const res = await request(app).post(`/api/forms/${created.body.form.id}/publish`).set(auth(token));
    expect(res.status).toBe(400);
  });

  it('publishes and unpublishes a form with questions', async () => {
    const { token } = await registerUser();
    const created = await request(app).post('/api/forms').set(auth(token)).send({ title: 'Form' });
    await request(app)
      .put(`/api/forms/${created.body.form.id}`)
      .set(auth(token))
      .send({ questions: [{ type: 'short_text', label: 'Name', description: '', options: [], required: false }] });

    const published = await request(app).post(`/api/forms/${created.body.form.id}/publish`).set(auth(token));
    expect(published.status).toBe(200);
    expect(published.body.form.status).toBe('published');

    const unpublished = await request(app).post(`/api/forms/${created.body.form.id}/unpublish`).set(auth(token));
    expect(unpublished.body.form.status).toBe('draft');
  });
});

import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { limitsFor } from '../plans.js';
import { QUESTION_TYPES } from '../questionTypes.js';

const router = Router();
router.use(requireAuth);

function getOwnedForm(formId, userId) {
  return db.prepare('SELECT * FROM forms WHERE id = ? AND user_id = ?').get(formId, userId);
}

function questionsForForm(formId) {
  return db
    .prepare('SELECT * FROM questions WHERE form_id = ? ORDER BY order_index ASC')
    .all(formId)
    .map((q) => ({ ...q, options: JSON.parse(q.options || '[]'), required: !!q.required }));
}

function serializeForm(form) {
  const responseCount = db
    .prepare('SELECT COUNT(*) AS n FROM responses WHERE form_id = ?')
    .get(form.id).n;
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    slug: form.slug,
    layout: form.layout,
    themeColor: form.theme_color,
    status: form.status,
    thankYouTitle: form.thank_you_title,
    thankYouMessage: form.thank_you_message,
    createdAt: form.created_at,
    updatedAt: form.updated_at,
    responseCount,
  };
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) return 'Questions must be an array';
  for (const q of questions) {
    if (!QUESTION_TYPES.includes(q.type)) return `Unknown question type: ${q.type}`;
    if (typeof q.label !== 'string' || q.label.trim().length === 0) return 'Every question needs a label';
    if (q.options !== undefined && typeof q.options !== 'object') return 'Question options must be an object or array';
  }
  return null;
}

router.get('/', (req, res) => {
  const forms = db
    .prepare('SELECT * FROM forms WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.user.id)
    .map(serializeForm);
  const limits = limitsFor(req.user.plan);
  res.json({
    forms,
    usage: {
      formCount: forms.length,
      maxForms: Number.isFinite(limits.maxForms) ? limits.maxForms : null,
      maxResponsesPerForm: Number.isFinite(limits.maxResponsesPerForm) ? limits.maxResponsesPerForm : null,
    },
  });
});

router.post('/', (req, res) => {
  const limits = limitsFor(req.user.plan);
  const formCount = db.prepare('SELECT COUNT(*) AS n FROM forms WHERE user_id = ?').get(req.user.id).n;
  if (formCount >= limits.maxForms) {
    return res.status(403).json({
      error: `Your ${req.user.plan} plan allows up to ${limits.maxForms} forms. Upgrade to Pro for unlimited forms.`,
      code: 'PLAN_LIMIT_FORMS',
    });
  }

  const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'Untitled form';
  const description = typeof req.body?.description === 'string' ? req.body.description : '';
  const slug = nanoid(10);
  const info = db
    .prepare('INSERT INTO forms (user_id, title, description, slug) VALUES (?, ?, ?, ?)')
    .run(req.user.id, title, description, slug);
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ form: serializeForm(form), questions: [] });
});

router.post('/:id/duplicate', (req, res) => {
  const source = getOwnedForm(req.params.id, req.user.id);
  if (!source) return res.status(404).json({ error: 'Form not found' });

  const limits = limitsFor(req.user.plan);
  const formCount = db.prepare('SELECT COUNT(*) AS n FROM forms WHERE user_id = ?').get(req.user.id).n;
  if (formCount >= limits.maxForms) {
    return res.status(403).json({
      error: `Your ${req.user.plan} plan allows up to ${limits.maxForms} forms. Upgrade to Pro for unlimited forms.`,
      code: 'PLAN_LIMIT_FORMS',
    });
  }

  const tx = db.transaction(() => {
    const slug = nanoid(10);
    const info = db
      .prepare(
        `INSERT INTO forms (user_id, title, description, slug, layout, theme_color, thank_you_title, thank_you_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        req.user.id,
        `${source.title} (copy)`,
        source.description,
        slug,
        source.layout,
        source.theme_color,
        source.thank_you_title,
        source.thank_you_message
      );
    const newFormId = info.lastInsertRowid;
    const insertQuestion = db.prepare(
      'INSERT INTO questions (form_id, type, label, description, options, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const q of questionsForForm(source.id)) {
      insertQuestion.run(newFormId, q.type, q.label, q.description, JSON.stringify(q.options), q.required ? 1 : 0, q.order_index);
    }
    return newFormId;
  });
  const newFormId = tx();

  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(newFormId);
  res.status(201).json({ form: serializeForm(form), questions: questionsForForm(newFormId) });
});

router.get('/:id', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ form: serializeForm(form), questions: questionsForForm(form.id) });
});

router.put('/:id', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const { title, description, layout, themeColor, thankYouTitle, thankYouMessage, questions } = req.body || {};

  if (questions !== undefined) {
    const err = validateQuestions(questions);
    if (err) return res.status(400).json({ error: err });
  }

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE forms SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        layout = COALESCE(?, layout),
        theme_color = COALESCE(?, theme_color),
        thank_you_title = COALESCE(?, thank_you_title),
        thank_you_message = COALESCE(?, thank_you_message),
        updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      typeof title === 'string' ? title.trim() || 'Untitled form' : null,
      typeof description === 'string' ? description : null,
      layout === 'typeform' || layout === 'classic' ? layout : null,
      typeof themeColor === 'string' ? themeColor : null,
      typeof thankYouTitle === 'string' ? thankYouTitle.trim() || "Thanks — that's recorded." : null,
      typeof thankYouMessage === 'string' ? thankYouMessage : null,
      form.id
    );

    if (Array.isArray(questions)) {
      db.prepare('DELETE FROM questions WHERE form_id = ?').run(form.id);
      const insert = db.prepare(
        'INSERT INTO questions (form_id, type, label, description, options, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      questions.forEach((q, index) => {
        insert.run(
          form.id,
          q.type,
          q.label.trim(),
          typeof q.description === 'string' ? q.description : '',
          JSON.stringify(q.options ?? []),
          q.required ? 1 : 0,
          index
        );
      });
    }
  });
  tx();

  const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id);
  res.json({ form: serializeForm(updated), questions: questionsForForm(form.id) });
});

router.delete('/:id', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  db.prepare('DELETE FROM forms WHERE id = ?').run(form.id);
  res.status(204).end();
});

router.post('/:id/publish', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  const questionCount = db.prepare('SELECT COUNT(*) AS n FROM questions WHERE form_id = ?').get(form.id).n;
  if (questionCount === 0) {
    return res.status(400).json({ error: 'Add at least one question before publishing' });
  }
  db.prepare("UPDATE forms SET status = 'published', updated_at = datetime('now') WHERE id = ?").run(form.id);
  const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id);
  res.json({ form: serializeForm(updated) });
});

router.post('/:id/unpublish', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  db.prepare("UPDATE forms SET status = 'draft', updated_at = datetime('now') WHERE id = ?").run(form.id);
  const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id);
  res.json({ form: serializeForm(updated) });
});

export default router;

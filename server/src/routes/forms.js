import { Router } from 'express';
import { nanoid } from 'nanoid';
import { pool, queryOne, queryAll, withTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../asyncHandler.js';
import { chargeCredits, insufficientCreditsResponse } from '../credits.js';
import { questionsForForm, serializeForm } from '../formHelpers.js';
import { QUESTION_TYPES } from '../questionTypes.js';

const router = Router();
router.use(requireAuth);

function getOwnedForm(formId, userId) {
  return queryOne('SELECT * FROM forms WHERE id = $1 AND user_id = $2', [formId, userId]);
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

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await queryAll('SELECT * FROM forms WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.id]);
    const forms = await Promise.all(rows.map(serializeForm));
    res.json({ forms });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const charge = await chargeCredits(req.user, 'createForm');
    if (!charge.ok) return insufficientCreditsResponse(res, charge.cost);

    const title = typeof req.body?.title === 'string' && req.body.title.trim() ? req.body.title.trim() : 'Untitled form';
    const description = typeof req.body?.description === 'string' ? req.body.description : '';
    const slug = nanoid(10);
    const form = await queryOne(
      'INSERT INTO forms (user_id, title, description, slug) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, description, slug]
    );
    res.status(201).json({ form: await serializeForm(form), questions: [] });
  })
);

router.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const source = await getOwnedForm(req.params.id, req.user.id);
    if (!source) return res.status(404).json({ error: 'Form not found' });

    const charge = await chargeCredits(req.user, 'duplicateForm');
    if (!charge.ok) return insufficientCreditsResponse(res, charge.cost);

    const sourceQuestions = await questionsForForm(source.id);

    const newFormId = await withTransaction(async (client) => {
      const slug = nanoid(10);
      const { rows } = await client.query(
        `INSERT INTO forms (user_id, title, description, slug, layout, theme_color, thank_you_title, thank_you_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          req.user.id,
          `${source.title} (copy)`,
          source.description,
          slug,
          source.layout,
          source.theme_color,
          source.thank_you_title,
          source.thank_you_message,
        ]
      );
      const formId = rows[0].id;
      for (const q of sourceQuestions) {
        await client.query(
          'INSERT INTO questions (form_id, type, label, description, options, required, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [formId, q.type, q.label, q.description, JSON.stringify(q.options), q.required, q.order_index]
        );
      }
      return formId;
    });

    const form = await queryOne('SELECT * FROM forms WHERE id = $1', [newFormId]);
    res.status(201).json({ form: await serializeForm(form), questions: await questionsForForm(newFormId) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const form = await getOwnedForm(req.params.id, req.user.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json({ form: await serializeForm(form), questions: await questionsForForm(form.id) });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const form = await getOwnedForm(req.params.id, req.user.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const { title, description, layout, themeColor, thankYouTitle, thankYouMessage, questions } = req.body || {};

    if (questions !== undefined) {
      const err = validateQuestions(questions);
      if (err) return res.status(400).json({ error: err });
    }

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE forms SET
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          layout = COALESCE($3, layout),
          theme_color = COALESCE($4, theme_color),
          thank_you_title = COALESCE($5, thank_you_title),
          thank_you_message = COALESCE($6, thank_you_message),
          updated_at = NOW()
         WHERE id = $7`,
        [
          typeof title === 'string' ? title.trim() || 'Untitled form' : null,
          typeof description === 'string' ? description : null,
          layout === 'typeform' || layout === 'classic' ? layout : null,
          typeof themeColor === 'string' ? themeColor : null,
          typeof thankYouTitle === 'string' ? thankYouTitle.trim() || "Thanks — that's recorded." : null,
          typeof thankYouMessage === 'string' ? thankYouMessage : null,
          form.id,
        ]
      );

      if (Array.isArray(questions)) {
        await client.query('DELETE FROM questions WHERE form_id = $1', [form.id]);
        for (const [index, q] of questions.entries()) {
          await client.query(
            'INSERT INTO questions (form_id, type, label, description, options, required, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [form.id, q.type, q.label.trim(), typeof q.description === 'string' ? q.description : '', JSON.stringify(q.options ?? []), !!q.required, index]
          );
        }
      }
    });

    const updated = await queryOne('SELECT * FROM forms WHERE id = $1', [form.id]);
    res.json({ form: await serializeForm(updated), questions: await questionsForForm(form.id) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const form = await getOwnedForm(req.params.id, req.user.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    await pool.query('DELETE FROM forms WHERE id = $1', [form.id]);
    res.status(204).end();
  })
);

router.post(
  '/:id/publish',
  asyncHandler(async (req, res) => {
    const form = await getOwnedForm(req.params.id, req.user.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    const { n: questionCount } = await queryOne('SELECT COUNT(*) AS n FROM questions WHERE form_id = $1', [form.id]);
    if (Number(questionCount) === 0) {
      return res.status(400).json({ error: 'Add at least one question before publishing' });
    }
    await pool.query("UPDATE forms SET status = 'published', updated_at = NOW() WHERE id = $1", [form.id]);
    const updated = await queryOne('SELECT * FROM forms WHERE id = $1', [form.id]);
    res.json({ form: await serializeForm(updated) });
  })
);

router.post(
  '/:id/unpublish',
  asyncHandler(async (req, res) => {
    const form = await getOwnedForm(req.params.id, req.user.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    await pool.query("UPDATE forms SET status = 'draft', updated_at = NOW() WHERE id = $1", [form.id]);
    const updated = await queryOne('SELECT * FROM forms WHERE id = $1', [form.id]);
    res.json({ form: await serializeForm(updated) });
  })
);

export default router;

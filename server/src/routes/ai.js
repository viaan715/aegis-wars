import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { anthropic, AI_MODEL } from '../aiClient.js';
import { chargeCredits, refundCredits, insufficientCreditsResponse } from '../credits.js';
import { questionsForForm, serializeForm } from '../formHelpers.js';
import { QUESTION_TYPES } from '../questionTypes.js';

const router = Router();
router.use(requireAuth);
router.use(rateLimit({ windowMs: 60_000, max: 15 }));

const GeneratedQuestion = z.object({
  type: z.enum(QUESTION_TYPES),
  label: z.string(),
  description: z.string(),
  options: z.array(z.string()),
  required: z.boolean(),
});

const GeneratedForm = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(GeneratedQuestion),
});

const ImprovedQuestion = z.object({
  label: z.string(),
  description: z.string(),
});

function aiUnavailableResponse(res) {
  return res.status(503).json({ error: 'AI generation is not configured on this server', code: 'AI_UNAVAILABLE' });
}

router.post('/generate-form', async (req, res) => {
  if (!anthropic) return aiUnavailableResponse(res);

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) return res.status(400).json({ error: 'Describe the form you want to generate' });

  const charge = chargeCredits(req.user, 'generateForm');
  if (!charge.ok) return insufficientCreditsResponse(res, charge.cost);

  try {
    const response = await anthropic.messages.parse({
      model: AI_MODEL,
      max_tokens: 4000,
      system:
        'You design survey and form questions. Given a short description of what someone wants to collect, ' +
        'produce a complete form: a clear title, a one-sentence description, and 4-8 well-chosen questions. ' +
        `Each question must use one of these types: ${QUESTION_TYPES.join(', ')}. ` +
        'Only multiple_choice, checkboxes, and dropdown questions should have non-empty options (2-6 short options); ' +
        'every other type must have an empty options array. Mark a question required only when it is essential.',
      messages: [{ role: 'user', content: prompt }],
      output_config: { format: zodOutputFormat(GeneratedForm) },
    });

    if (!response.parsed_output) {
      refundCredits(req.user, charge.cost);
      return res.status(502).json({ error: 'AI generation failed to produce a valid form. Try rephrasing your prompt.' });
    }

    // Persist the draft in the same request — folding "generate" and "create"
    // into one atomic action means the user is charged once for the whole
    // outcome, and there's no dangling AI-generated draft that failed to save.
    const { title, description, questions } = response.parsed_output;
    const slug = nanoid(10);
    const formId = db.transaction(() => {
      const info = db
        .prepare('INSERT INTO forms (user_id, title, description, slug) VALUES (?, ?, ?, ?)')
        .run(req.user.id, title.trim() || 'Untitled form', description, slug);
      const newFormId = info.lastInsertRowid;
      const insertQuestion = db.prepare(
        'INSERT INTO questions (form_id, type, label, description, options, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      questions.forEach((q, index) => {
        insertQuestion.run(newFormId, q.type, q.label.trim(), q.description, JSON.stringify(q.options), q.required ? 1 : 0, index);
      });
      return newFormId;
    })();

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId);
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
    res.status(201).json({ form: serializeForm(form), questions: questionsForForm(formId), creditsRemaining: user.credits });
  } catch (err) {
    refundCredits(req.user, charge.cost);
    if (err instanceof Anthropic.AuthenticationError) return aiUnavailableResponse(res);
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: 'AI generation is temporarily unavailable. Try again shortly.' });
    }
    throw err;
  }
});

router.post('/improve-question', async (req, res) => {
  if (!anthropic) return aiUnavailableResponse(res);

  const { label, description, type } = req.body || {};
  if (typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'Write a draft question first, then let AI improve it' });
  }

  const charge = chargeCredits(req.user, 'improveQuestion');
  if (!charge.ok) return insufficientCreditsResponse(res, charge.cost);

  try {
    const response = await anthropic.messages.parse({
      model: AI_MODEL,
      max_tokens: 1000,
      system:
        'You improve the wording of a single survey question. Make the label clear, concise, and unambiguous, ' +
        'and write a short helpful description (or an empty string if none is needed). ' +
        'Keep the meaning and intent of the original question the same — only improve the wording. ' +
        `The question type is "${type ?? 'unknown'}".`,
      messages: [
        {
          role: 'user',
          content: `Question label: ${label}\nQuestion description: ${description ?? ''}`,
        },
      ],
      output_config: { format: zodOutputFormat(ImprovedQuestion) },
    });

    if (!response.parsed_output) {
      refundCredits(req.user, charge.cost);
      return res.status(502).json({ error: 'AI could not improve this question. Try again.' });
    }

    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id);
    res.json({ ...response.parsed_output, creditsRemaining: user.credits });
  } catch (err) {
    refundCredits(req.user, charge.cost);
    if (err instanceof Anthropic.AuthenticationError) return aiUnavailableResponse(res);
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: 'AI generation is temporarily unavailable. Try again shortly.' });
    }
    throw err;
  }
});

export default router;

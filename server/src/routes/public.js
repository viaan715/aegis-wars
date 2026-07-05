import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { queryOne, withTransaction } from '../db.js';
import { UPLOADS_DIR } from '../config.js';
import { chargeCredits } from '../credits.js';
import { questionsForForm } from '../formHelpers.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();
const submitLimiter = rateLimit({ windowMs: 60_000, max: 30 });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 20);
      cb(null, `${nanoid(24)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});

router.get(
  '/forms/:slug',
  asyncHandler(async (req, res) => {
    const form = await queryOne("SELECT * FROM forms WHERE slug = $1 AND status = 'published'", [req.params.slug]);
    if (!form) return res.status(404).json({ error: 'This survey is not available' });

    const questions = await questionsForForm(form.id);
    res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        layout: form.layout,
        themeColor: form.theme_color,
        thankYouTitle: form.thank_you_title,
        thankYouMessage: form.thank_you_message,
        slug: form.slug,
      },
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        label: q.label,
        description: q.description,
        options: q.options,
        required: q.required,
      })),
    });
  })
);

router.post(
  '/forms/:slug/responses',
  submitLimiter,
  upload.any(),
  asyncHandler(async (req, res) => {
    const form = await queryOne("SELECT * FROM forms WHERE slug = $1 AND status = 'published'", [req.params.slug]);
    if (!form) return res.status(404).json({ error: 'This survey is not available' });

    const questions = await questionsForForm(form.id);

    let answersInput = {};
    try {
      answersInput = JSON.parse(req.body?.answers || '{}');
    } catch {
      return res.status(400).json({ error: 'Malformed answers payload' });
    }

    const filesByField = new Map();
    for (const file of req.files || []) {
      filesByField.set(file.fieldname, file);
    }

    const answersToInsert = [];
    for (const q of questions) {
      const raw = answersInput[q.id];
      const file = filesByField.get(`file_${q.id}`);

      if (q.type === 'file_upload') {
        if (q.required && !file) {
          return res.status(400).json({ error: `"${q.label}" is required` });
        }
        if (file) {
          answersToInsert.push({
            questionId: q.id,
            value: JSON.stringify({ fileName: file.originalname, url: `/uploads/${file.filename}` }),
          });
        }
        continue;
      }

      const isEmpty =
        raw === undefined ||
        raw === null ||
        raw === '' ||
        (Array.isArray(raw) && raw.length === 0);

      if (q.required && isEmpty) {
        return res.status(400).json({ error: `"${q.label}" is required` });
      }
      if (isEmpty) continue;

      if (q.type === 'checkboxes' && !Array.isArray(raw)) {
        return res.status(400).json({ error: `"${q.label}" expects multiple selections` });
      }
      if (['multiple_choice', 'dropdown'].includes(q.type) && !q.options.includes(raw)) {
        return res.status(400).json({ error: `"${q.label}" has an invalid selection` });
      }
      if (q.type === 'checkboxes' && !raw.every((v) => q.options.includes(v))) {
        return res.status(400).json({ error: `"${q.label}" has an invalid selection` });
      }
      if (q.type === 'rating' && (Number(raw) < 1 || Number(raw) > 5)) {
        return res.status(400).json({ error: `"${q.label}" must be between 1 and 5` });
      }
      if (q.type === 'scale' && (Number(raw) < 0 || Number(raw) > 10)) {
        return res.status(400).json({ error: `"${q.label}" must be between 0 and 10` });
      }
      if (q.type === 'number' && Number.isNaN(Number(raw))) {
        return res.status(400).json({ error: `"${q.label}" must be a number` });
      }

      answersToInsert.push({ questionId: q.id, value: JSON.stringify(raw) });
    }

    const owner = await queryOne('SELECT id, plan FROM users WHERE id = $1', [form.user_id]);
    const charge = await chargeCredits(owner, 'collectResponse');
    if (!charge.ok) {
      return res.status(403).json({ error: 'This survey is not currently accepting responses' });
    }

    await withTransaction(async (client) => {
      const { rows } = await client.query('INSERT INTO responses (form_id) VALUES ($1) RETURNING id', [form.id]);
      const responseId = rows[0].id;
      for (const a of answersToInsert) {
        await client.query('INSERT INTO answers (response_id, question_id, value) VALUES ($1, $2, $3)', [
          responseId,
          a.questionId,
          a.value,
        ]);
      }
    });

    res.status(201).json({ ok: true });
  })
);

export default router;

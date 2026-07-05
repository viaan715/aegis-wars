import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { UPLOADS_DIR } from '../config.js';
import { chargeCredits } from '../credits.js';
import { questionsForForm } from '../formHelpers.js';
import { rateLimit } from '../middleware/rateLimit.js';

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

router.get('/forms/:slug', (req, res) => {
  const form = db
    .prepare("SELECT * FROM forms WHERE slug = ? AND status = 'published'")
    .get(req.params.slug);
  if (!form) return res.status(404).json({ error: 'This survey is not available' });

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
    questions: questionsForForm(form.id).map((q) => ({
      id: q.id,
      type: q.type,
      label: q.label,
      description: q.description,
      options: q.options,
      required: q.required,
    })),
  });
});

router.post('/forms/:slug/responses', submitLimiter, upload.any(), (req, res) => {
  const form = db
    .prepare("SELECT * FROM forms WHERE slug = ? AND status = 'published'")
    .get(req.params.slug);
  if (!form) return res.status(404).json({ error: 'This survey is not available' });

  const questions = questionsForForm(form.id);

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

  const owner = db.prepare('SELECT id, plan FROM users WHERE id = ?').get(form.user_id);
  const charge = chargeCredits(owner, 'collectResponse');
  if (!charge.ok) {
    return res.status(403).json({ error: 'This survey is not currently accepting responses' });
  }

  const tx = db.transaction(() => {
    const info = db.prepare('INSERT INTO responses (form_id) VALUES (?)').run(form.id);
    const insertAnswer = db.prepare('INSERT INTO answers (response_id, question_id, value) VALUES (?, ?, ?)');
    for (const a of answersToInsert) {
      insertAnswer.run(info.lastInsertRowid, a.questionId, a.value);
    }
    return info.lastInsertRowid;
  });
  tx();

  res.status(201).json({ ok: true });
});

export default router;

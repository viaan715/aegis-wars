import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { CHOICE_TYPES } from '../questionTypes.js';

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

function loadResponses(formId) {
  const responses = db
    .prepare('SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC')
    .all(formId);
  const answerStmt = db.prepare('SELECT * FROM answers WHERE response_id = ?');
  return responses.map((r) => ({
    id: r.id,
    submittedAt: r.submitted_at,
    answers: answerStmt.all(r.id).map((a) => ({
      questionId: a.question_id,
      value: JSON.parse(a.value),
    })),
  }));
}

router.get('/:id/responses', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });
  res.json({ questions: questionsForForm(form.id), responses: loadResponses(form.id) });
});

router.get('/:id/analytics', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const questions = questionsForForm(form.id);
  const responses = loadResponses(form.id);

  const perQuestion = questions.map((q) => {
    const values = responses
      .flatMap((r) => r.answers.filter((a) => a.questionId === q.id))
      .map((a) => a.value);

    const answeredCount = values.length;
    const base = { questionId: q.id, label: q.label, type: q.type, answeredCount };

    if (CHOICE_TYPES.has(q.type)) {
      const counts = Object.fromEntries(q.options.map((o) => [o, 0]));
      for (const v of values) {
        if (Array.isArray(v)) {
          for (const item of v) counts[item] = (counts[item] ?? 0) + 1;
        } else {
          counts[v] = (counts[v] ?? 0) + 1;
        }
      }
      return { ...base, distribution: Object.entries(counts).map(([name, count]) => ({ name, count })) };
    }

    if (q.type === 'rating' || q.type === 'scale') {
      const nums = values.map(Number).filter((n) => !Number.isNaN(n));
      const average = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
      const max = q.type === 'rating' ? 5 : 10;
      const counts = {};
      for (let i = 0; i <= max; i += 1) counts[i] = 0;
      if (q.type === 'rating') delete counts[0];
      for (const n of nums) counts[n] = (counts[n] ?? 0) + 1;
      return {
        ...base,
        average: average === null ? null : Math.round(average * 100) / 100,
        distribution: Object.entries(counts).map(([name, count]) => ({ name, count })),
      };
    }

    return { ...base, sampleValues: values.slice(0, 5) };
  });

  res.json({
    totalResponses: responses.length,
    questions: perQuestion,
  });
});

router.get('/:id/responses/export.csv', (req, res) => {
  const form = getOwnedForm(req.params.id, req.user.id);
  if (!form) return res.status(404).json({ error: 'Form not found' });

  const questions = questionsForForm(form.id);
  const responses = loadResponses(form.id);

  const escapeCsv = (value) => {
    const str = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const formatValue = (v) => {
    if (v === undefined) return '';
    if (Array.isArray(v)) return v.join('; ');
    if (v && typeof v === 'object' && 'fileName' in v) return v.fileName;
    return v;
  };

  const header = ['Response ID', 'Submitted At', ...questions.map((q) => q.label)];
  const rows = responses.map((r) => {
    const byQuestion = Object.fromEntries(r.answers.map((a) => [a.questionId, a.value]));
    return [r.id, r.submittedAt, ...questions.map((q) => formatValue(byQuestion[q.id]))];
  });

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const filename = `${form.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'form'}-responses.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

export default router;

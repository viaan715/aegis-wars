import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { PLANS } from '../plans.js';

const router = Router();

router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(PLANS).map(([id, plan]) => ({
      id,
      label: plan.label,
      maxForms: Number.isFinite(plan.maxForms) ? plan.maxForms : null,
      maxResponsesPerForm: Number.isFinite(plan.maxResponsesPerForm) ? plan.maxResponsesPerForm : null,
    })),
  });
});

// No real payment processor is wired up yet — this simulates an upgrade so the
// product flow (limits, upsell prompts) can be built and demoed end to end.
router.post('/upgrade', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run('pro', req.user.id);
  res.json({ user: { ...req.user, plan: 'pro' } });
});

router.post('/downgrade', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run('free', req.user.id);
  res.json({ user: { ...req.user, plan: 'free' } });
});

export default router;

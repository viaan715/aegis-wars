import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PLAN_LABELS = { free: 'Free', pro: 'Pro' };

router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(PLAN_LABELS).map(([id, label]) => ({ id, label })),
  });
});

// No real payment processor is wired up yet — this simulates an upgrade so the
// product flow (unlimited credits, upsell prompts) can be built and demoed end to end.
router.post('/upgrade', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run('pro', req.user.id);
  const user = db.prepare('SELECT id, email, name, plan, credits FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

router.post('/downgrade', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run('free', req.user.id);
  const user = db.prepare('SELECT id, email, name, plan, credits FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

export default router;

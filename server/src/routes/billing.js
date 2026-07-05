import { Router } from 'express';
import { pool, queryOne } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../asyncHandler.js';

const router = Router();

const PLAN_LABELS = { free: 'Free', pro: 'Pro' };

router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(PLAN_LABELS).map(([id, label]) => ({ id, label })),
  });
});

// No real payment processor is wired up yet — this simulates an upgrade so the
// product flow (unlimited credits, upsell prompts) can be built and demoed end to end.
router.post(
  '/upgrade',
  requireAuth,
  asyncHandler(async (req, res) => {
    await pool.query('UPDATE users SET plan = $1 WHERE id = $2', ['pro', req.user.id]);
    const user = await queryOne('SELECT id, email, name, plan, credits FROM users WHERE id = $1', [req.user.id]);
    res.json({ user });
  })
);

router.post(
  '/downgrade',
  requireAuth,
  asyncHandler(async (req, res) => {
    await pool.query('UPDATE users SET plan = $1 WHERE id = $2', ['free', req.user.id]);
    const user = await queryOne('SELECT id, email, name, plan, credits FROM users WHERE id = $1', [req.user.id]);
    res.json({ user });
  })
);

export default router;

import { pool } from './db.js';

export const STARTER_CREDITS = 100;

export const CREDIT_COSTS = {
  createForm: 5,
  duplicateForm: 5,
  collectResponse: 1,
  generateForm: 5,
  improveQuestion: 1,
};

export function hasUnlimitedCredits(plan) {
  return plan === 'pro';
}

// user only needs {id, plan} — pass req.user or a lighter row (e.g. a form's owner).
export async function chargeCredits(user, action) {
  const cost = CREDIT_COSTS[action];
  if (hasUnlimitedCredits(user.plan)) return { ok: true, cost: 0 };
  const result = await pool.query(
    'UPDATE users SET credits = credits - $1 WHERE id = $2 AND credits >= $1',
    [cost, user.id]
  );
  return { ok: result.rowCount > 0, cost };
}

export async function refundCredits(user, cost) {
  if (!cost || hasUnlimitedCredits(user.plan)) return;
  await pool.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [cost, user.id]);
}

export function insufficientCreditsResponse(res, cost) {
  return res.status(402).json({
    error: `This costs ${cost} credit${cost === 1 ? '' : 's'}, and you don't have enough left. Upgrade to Pro for unlimited credits.`,
    code: 'INSUFFICIENT_CREDITS',
  });
}

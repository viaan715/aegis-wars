import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser, sanitizeDiets, VALID_DIETS } from '../utils/dietRestrictions.js';

const router = express.Router();

router.get('/diets', (_req, res) => {
  res.json({ diets: VALID_DIETS });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, householdSize, dietRestrictions } = req.body;

  const nextName = typeof name === 'string' && name.trim() ? name.trim() : req.user.name;
  const nextHouseholdSize =
    Number.isInteger(householdSize) && householdSize > 0
      ? householdSize
      : req.user.household_size;
  const nextDiets =
    dietRestrictions !== undefined
      ? sanitizeDiets(dietRestrictions)
      : JSON.parse(req.user.diet_restrictions);

  db.prepare(
    'UPDATE users SET name = ?, household_size = ?, diet_restrictions = ? WHERE id = ?'
  ).run(nextName, nextHouseholdSize, JSON.stringify(nextDiets), req.user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(updated) });
});

export default router;

import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { buildGroceryList } from '../services/groceryListBuilder.js';
import { getCurrentPlan } from '../services/planAccess.js';
import { createInstacartShoppingListLink } from '../services/instacartService.js';

const router = express.Router();

router.post('/send', requireAuth, async (req, res) => {
  const current = getCurrentPlan(req.user.id);
  if (!current) return res.status(404).json({ error: 'No meal plan yet — generate one first' });

  const items = db.prepare('SELECT * FROM meal_plan_items WHERE meal_plan_id = ?').all(current.plan.id);
  const pantry = db.prepare('SELECT * FROM pantry_items WHERE user_id = ?').all(req.user.id);
  const groceryList = buildGroceryList(
    items.map((i) => ({ recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier })),
    pantry
  );

  if (groceryList.length === 0) {
    return res.status(400).json({ error: 'Grocery list is empty — nothing to send to Instacart' });
  }

  try {
    const url = await createInstacartShoppingListLink({
      title: `Weekly grocery list — week of ${current.plan.week_start_date}`,
      lineItems: groceryList,
    });
    res.json({ url });
  } catch (err) {
    const status = err.code === 'NOT_CONFIGURED' ? 503 : 502;
    res.status(status).json({ error: err.message });
  }
});

export default router;

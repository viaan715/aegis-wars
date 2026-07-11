import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { buildGroceryList, key } from '../services/groceryListBuilder.js';
import { getCurrentPlan } from '../services/planAccess.js';
import { getCustomRecipesForUser } from '../services/customRecipes.js';
import { estimateGroceryListCost } from '../services/costEstimate.js';

const router = express.Router();

/** Recomputes the grocery list for the user's current plan and syncs it into
 * grocery_list_items, preserving each item's checked state where the item
 * (by name+unit) still appears in the recomputed list. */
function syncGroceryList(planId, userId) {
  const items = db.prepare('SELECT * FROM meal_plan_items WHERE meal_plan_id = ?').all(planId);
  const pantry = db.prepare('SELECT * FROM pantry_items WHERE user_id = ?').all(userId);
  const customRecipes = getCustomRecipesForUser(userId);

  const computed = buildGroceryList(
    items.map((i) => ({ recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier })),
    pantry,
    customRecipes
  );

  const existingRows = db.prepare('SELECT * FROM grocery_list_items WHERE meal_plan_id = ?').all(planId);
  const existingByKey = new Map(existingRows.map((r) => [key(r.ingredient_name, r.unit), r]));
  const computedKeys = new Set(computed.map((c) => key(c.name, c.unit)));

  const insert = db.prepare(
    'INSERT INTO grocery_list_items (meal_plan_id, ingredient_name, quantity, unit, category, checked) VALUES (?, ?, ?, ?, ?, 0)'
  );
  const update = db.prepare(
    'UPDATE grocery_list_items SET quantity = ?, category = ? WHERE id = ?'
  );
  const remove = db.prepare('DELETE FROM grocery_list_items WHERE id = ?');

  db.transaction(() => {
    for (const c of computed) {
      const existing = existingByKey.get(key(c.name, c.unit));
      if (existing) {
        update.run(c.quantity, c.category, existing.id);
      } else {
        insert.run(planId, c.name, c.quantity, c.unit, c.category);
      }
    }
    for (const row of existingRows) {
      if (!computedKeys.has(key(row.ingredient_name, row.unit))) {
        remove.run(row.id);
      }
    }
  })();

  return db
    .prepare('SELECT * FROM grocery_list_items WHERE meal_plan_id = ? ORDER BY category, ingredient_name')
    .all(planId);
}

function serialize(row) {
  return {
    id: row.id,
    name: row.ingredient_name,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    checked: Boolean(row.checked),
  };
}

router.get('/current', requireAuth, (req, res) => {
  const current = getCurrentPlan(req.user.id);
  if (!current) return res.status(404).json({ error: 'No meal plan yet — generate one first' });

  const rows = syncGroceryList(current.plan.id, req.user.id);
  const items = rows.map(serialize);
  res.json({
    mealPlanId: current.plan.id,
    items,
    estimatedCost: estimateGroceryListCost(items),
  });
});

router.patch('/items/:id', requireAuth, (req, res) => {
  const { checked } = req.body;
  if (typeof checked !== 'boolean') return res.status(400).json({ error: 'checked (boolean) is required' });

  const row = db
    .prepare(
      `SELECT gli.* FROM grocery_list_items gli
       JOIN meal_plans mp ON mp.id = gli.meal_plan_id
       WHERE gli.id = ? AND mp.user_id = ?`
    )
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Grocery item not found' });

  db.prepare('UPDATE grocery_list_items SET checked = ? WHERE id = ?').run(checked ? 1 : 0, row.id);
  res.json({ item: serialize({ ...row, checked: checked ? 1 : 0 }) });
});

export default router;

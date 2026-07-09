import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { generatePlan, generateSingleMeal, MEAL_TYPES } from '../services/mealPlanGenerator.js';
import { summarizeNutrition } from '../services/groceryListBuilder.js';
import { getCurrentPlan, serializeItems } from '../services/planAccess.js';

const router = express.Router();

function getFavoriteIds(userId) {
  return db
    .prepare('SELECT recipe_id FROM favorites WHERE user_id = ?')
    .all(userId)
    .map((r) => r.recipe_id);
}

function upcomingMonday() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysUntilMonday = day === 1 ? 0 : ((8 - day) % 7);
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  return monday.toISOString().slice(0, 10);
}

router.post('/generate', requireAuth, (req, res) => {
  const diets = JSON.parse(req.user.diet_restrictions);
  const householdSize = req.user.household_size;
  const favoriteRecipeIds = getFavoriteIds(req.user.id);

  const items = generatePlan({ diets, favoriteRecipeIds, householdSize });

  const insertPlan = db.prepare(
    'INSERT INTO meal_plans (user_id, week_start_date, household_size) VALUES (?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO meal_plan_items (meal_plan_id, day_index, meal_type, recipe_id, servings_multiplier) VALUES (?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    const result = insertPlan.run(req.user.id, upcomingMonday(), householdSize);
    for (const item of items) {
      insertItem.run(result.lastInsertRowid, item.dayIndex, item.mealType, item.recipeId, item.servingsMultiplier);
    }
  })();

  const { plan, items: dbItems } = getCurrentPlan(req.user.id);
  res.status(201).json({
    mealPlan: { id: plan.id, weekStartDate: plan.week_start_date, householdSize: plan.household_size },
    items: serializeItems(dbItems),
    nutrition: summarizeNutrition(
      dbItems.map((i) => ({ dayIndex: i.day_index, recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier }))
    ),
  });
});

router.get('/current', requireAuth, (req, res) => {
  const current = getCurrentPlan(req.user.id);
  if (!current) return res.json({ mealPlan: null, items: [], nutrition: null });

  const { plan, items } = current;
  res.json({
    mealPlan: { id: plan.id, weekStartDate: plan.week_start_date, householdSize: plan.household_size },
    items: serializeItems(items),
    nutrition: summarizeNutrition(
      items.map((i) => ({ dayIndex: i.day_index, recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier }))
    ),
  });
});

router.patch('/current/items/:dayIndex/:mealType', requireAuth, (req, res) => {
  const dayIndex = Number(req.params.dayIndex);
  const { mealType } = req.params;
  if (!MEAL_TYPES.includes(mealType) || !Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
    return res.status(400).json({ error: 'Invalid dayIndex or mealType' });
  }

  const current = getCurrentPlan(req.user.id);
  if (!current) return res.status(404).json({ error: 'No meal plan exists yet' });

  const existing = current.items.find((i) => i.day_index === dayIndex && i.meal_type === mealType);
  if (!existing) return res.status(404).json({ error: 'Meal slot not found' });

  const diets = JSON.parse(req.user.diet_restrictions);
  const favoriteRecipeIds = getFavoriteIds(req.user.id);
  const replacement = generateSingleMeal({
    diets,
    favoriteRecipeIds,
    householdSize: req.user.household_size,
    mealType,
    excludeRecipeId: existing.recipe_id,
  });

  db.prepare('UPDATE meal_plan_items SET recipe_id = ?, servings_multiplier = ? WHERE id = ?').run(
    replacement.recipeId,
    replacement.servingsMultiplier,
    existing.id
  );

  const updated = getCurrentPlan(req.user.id);
  res.json({
    items: serializeItems(updated.items),
    nutrition: summarizeNutrition(
      updated.items.map((i) => ({ dayIndex: i.day_index, recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier }))
    ),
  });
});

export default router;

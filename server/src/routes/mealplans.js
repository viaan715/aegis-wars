import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { generatePlan, generateSingleMeal, MEAL_TYPES, TEMPLATES } from '../services/mealPlanGenerator.js';
import { summarizeNutrition } from '../services/groceryListBuilder.js';
import { getCurrentPlan, getPlanById, getPlanHistory, serializeItems } from '../services/planAccess.js';
import { getCustomRecipesForUser } from '../services/customRecipes.js';
import { getRatingsMapForUser } from '../services/ratings.js';

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

function toGeneratorItems(items) {
  return items.map((i) => ({ dayIndex: i.day_index, recipeId: i.recipe_id, servingsMultiplier: i.servings_multiplier }));
}

function planSummary(plan) {
  return { id: plan.id, weekStartDate: plan.week_start_date, householdSize: plan.household_size };
}

router.post('/generate', requireAuth, (req, res) => {
  const { template } = req.body || {};
  if (template && !TEMPLATES.includes(template)) {
    return res.status(400).json({ error: `template must be one of: ${TEMPLATES.join(', ')}` });
  }

  const diets = JSON.parse(req.user.diet_restrictions);
  const householdSize = req.user.household_size;
  const favoriteRecipeIds = getFavoriteIds(req.user.id);
  const customRecipes = getCustomRecipesForUser(req.user.id);
  const ratings = getRatingsMapForUser(req.user.id);

  const items = generatePlan({ diets, favoriteRecipeIds, householdSize, customRecipes, ratings, template });

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
    mealPlan: planSummary(plan),
    items: serializeItems(dbItems, customRecipes),
    nutrition: summarizeNutrition(toGeneratorItems(dbItems), customRecipes),
  });
});

router.get('/current', requireAuth, (req, res) => {
  const current = getCurrentPlan(req.user.id);
  if (!current) return res.json({ mealPlan: null, items: [], nutrition: null });

  const customRecipes = getCustomRecipesForUser(req.user.id);
  const { plan, items } = current;
  res.json({
    mealPlan: planSummary(plan),
    items: serializeItems(items, customRecipes),
    nutrition: summarizeNutrition(toGeneratorItems(items), customRecipes),
  });
});

router.get('/history', requireAuth, (req, res) => {
  const history = getPlanHistory(req.user.id).map((plan) => ({
    id: plan.id,
    weekStartDate: plan.week_start_date,
    householdSize: plan.household_size,
    createdAt: plan.created_at,
  }));
  res.json({ history });
});

router.get('/:id', requireAuth, (req, res) => {
  const planId = Number(req.params.id);
  if (!Number.isInteger(planId)) return res.status(400).json({ error: 'Invalid plan id' });

  const found = getPlanById(req.user.id, planId);
  if (!found) return res.status(404).json({ error: 'Meal plan not found' });

  const customRecipes = getCustomRecipesForUser(req.user.id);
  const { plan, items } = found;
  res.json({
    mealPlan: planSummary(plan),
    items: serializeItems(items, customRecipes),
    nutrition: summarizeNutrition(toGeneratorItems(items), customRecipes),
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
  const customRecipes = getCustomRecipesForUser(req.user.id);
  const ratings = getRatingsMapForUser(req.user.id);
  const replacement = generateSingleMeal({
    diets,
    favoriteRecipeIds,
    householdSize: req.user.household_size,
    mealType,
    excludeRecipeId: existing.recipe_id,
    customRecipes,
    ratings,
  });

  db.prepare('UPDATE meal_plan_items SET recipe_id = ?, servings_multiplier = ? WHERE id = ?').run(
    replacement.recipeId,
    replacement.servingsMultiplier,
    existing.id
  );

  const updated = getCurrentPlan(req.user.id);
  res.json({
    items: serializeItems(updated.items, customRecipes),
    nutrition: summarizeNutrition(toGeneratorItems(updated.items), customRecipes),
  });
});

router.patch('/current/items/swap-positions', requireAuth, (req, res) => {
  const { mealType, dayIndexA, dayIndexB } = req.body || {};
  if (
    !MEAL_TYPES.includes(mealType) ||
    !Number.isInteger(dayIndexA) ||
    !Number.isInteger(dayIndexB) ||
    dayIndexA < 0 ||
    dayIndexA > 6 ||
    dayIndexB < 0 ||
    dayIndexB > 6 ||
    dayIndexA === dayIndexB
  ) {
    return res.status(400).json({ error: 'mealType and two distinct dayIndex values (0-6) are required' });
  }

  const current = getCurrentPlan(req.user.id);
  if (!current) return res.status(404).json({ error: 'No meal plan exists yet' });

  const itemA = current.items.find((i) => i.day_index === dayIndexA && i.meal_type === mealType);
  const itemB = current.items.find((i) => i.day_index === dayIndexB && i.meal_type === mealType);
  if (!itemA || !itemB) return res.status(404).json({ error: 'Meal slot not found' });

  db.transaction(() => {
    db.prepare('UPDATE meal_plan_items SET recipe_id = ?, servings_multiplier = ? WHERE id = ?').run(
      itemB.recipe_id,
      itemB.servings_multiplier,
      itemA.id
    );
    db.prepare('UPDATE meal_plan_items SET recipe_id = ?, servings_multiplier = ? WHERE id = ?').run(
      itemA.recipe_id,
      itemA.servings_multiplier,
      itemB.id
    );
  })();

  const customRecipes = getCustomRecipesForUser(req.user.id);
  const updated = getCurrentPlan(req.user.id);
  res.json({
    items: serializeItems(updated.items, customRecipes),
    nutrition: summarizeNutrition(toGeneratorItems(updated.items), customRecipes),
  });
});

export default router;

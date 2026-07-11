import db from '../db/index.js';
import { getRecipeByIdWithExtra } from '../data/recipeStore.js';

export function getCurrentPlan(userId) {
  const plan = db
    .prepare('SELECT * FROM meal_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1')
    .get(userId);
  if (!plan) return null;
  const items = db
    .prepare('SELECT * FROM meal_plan_items WHERE meal_plan_id = ? ORDER BY day_index, meal_type')
    .all(plan.id);
  return { plan, items };
}

export function getPlanById(userId, planId) {
  const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ? AND user_id = ?').get(planId, userId);
  if (!plan) return null;
  const items = db
    .prepare('SELECT * FROM meal_plan_items WHERE meal_plan_id = ? ORDER BY day_index, meal_type')
    .all(plan.id);
  return { plan, items };
}

export function getPlanHistory(userId) {
  return db
    .prepare('SELECT id, week_start_date, household_size, created_at FROM meal_plans WHERE user_id = ? ORDER BY id DESC')
    .all(userId);
}

export function serializeItems(items, customRecipes = []) {
  return items.map((item) => ({
    dayIndex: item.day_index,
    mealType: item.meal_type,
    servingsMultiplier: item.servings_multiplier,
    recipe: item.recipe_id ? getRecipeByIdWithExtra(item.recipe_id, customRecipes) : null,
  }));
}

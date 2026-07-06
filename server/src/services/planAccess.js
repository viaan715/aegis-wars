import db from '../db/index.js';
import { getRecipeById } from '../data/recipeStore.js';

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

export function serializeItems(items) {
  return items.map((item) => ({
    dayIndex: item.day_index,
    mealType: item.meal_type,
    servingsMultiplier: item.servings_multiplier,
    recipe: item.recipe_id ? getRecipeById(item.recipe_id) : null,
  }));
}

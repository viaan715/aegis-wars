import { findRecipes } from '../data/recipeStore.js';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const DAYS_PER_WEEK = 7;

function weightedPick(pool, favoriteIds, usageCount) {
  const weights = pool.map((recipe) => {
    const favoriteBoost = favoriteIds.has(recipe.id) ? 3 : 1;
    const repeatPenalty = 1 + (usageCount.get(recipe.id) || 0);
    return favoriteBoost / repeatPenalty;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Builds a 7-day x {breakfast,lunch,dinner,snack} plan. Slots with no recipe
 * matching the combined diet restrictions are returned with recipeId: null
 * rather than silently violating a restriction the user asked for.
 */
export function generatePlan({ diets = [], favoriteRecipeIds = [], householdSize = 2 }) {
  const favoriteIds = new Set(favoriteRecipeIds);
  const usageCount = new Map();
  const items = [];

  for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
    for (const mealType of MEAL_TYPES) {
      const pool = findRecipes({ mealType, diets });
      if (pool.length === 0) {
        items.push({ dayIndex, mealType, recipeId: null, servingsMultiplier: 1 });
        continue;
      }
      const recipe = weightedPick(pool, favoriteIds, usageCount);
      usageCount.set(recipe.id, (usageCount.get(recipe.id) || 0) + 1);
      items.push({
        dayIndex,
        mealType,
        recipeId: recipe.id,
        servingsMultiplier: householdSize / recipe.baseServings,
      });
    }
  }

  return items;
}

/** Regenerates a single (dayIndex, mealType) slot, avoiding the current recipe if alternatives exist. */
export function generateSingleMeal({ diets = [], favoriteRecipeIds = [], householdSize = 2, mealType, excludeRecipeId }) {
  const favoriteIds = new Set(favoriteRecipeIds);
  let pool = findRecipes({ mealType, diets });
  if (pool.length === 0) {
    return { recipeId: null, servingsMultiplier: 1 };
  }
  if (pool.length > 1 && excludeRecipeId) {
    pool = pool.filter((r) => r.id !== excludeRecipeId);
  }
  const recipe = weightedPick(pool, favoriteIds, new Map());
  return { recipeId: recipe.id, servingsMultiplier: householdSize / recipe.baseServings };
}

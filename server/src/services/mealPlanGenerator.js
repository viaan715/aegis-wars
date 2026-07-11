import { findRecipesWithExtra } from '../data/recipeStore.js';
import { estimateRecipeCost } from './costEstimate.js';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const DAYS_PER_WEEK = 7;
export const TEMPLATES = ['high-protein', 'lower-calorie', 'budget-friendly'];

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Templates bias selection toward recipes matching a theme, relative to the
 * current candidate pool (not a hardcoded absolute threshold), and boost
 * rather than hard-exclude so a template can't empty out an already
 * diet-restricted pool. */
function templateMultiplier(recipe, pool, template) {
  if (!template) return 1;

  if (template === 'high-protein') {
    const ratio = recipe.nutrition.calories > 0 ? (recipe.nutrition.protein * 4) / recipe.nutrition.calories : 0;
    return ratio >= 0.3 ? 2.5 : 0.7;
  }

  if (template === 'lower-calorie') {
    const m = median(pool.map((r) => r.nutrition.calories));
    return recipe.nutrition.calories <= m ? 2 : 0.6;
  }

  if (template === 'budget-friendly') {
    const m = median(pool.map((r) => estimateRecipeCost(r)));
    return estimateRecipeCost(recipe) <= m ? 2 : 0.6;
  }

  return 1;
}

function weightedPick(pool, favoriteIds, usageCount, ratings, template) {
  const weights = pool.map((recipe) => {
    const favoriteBoost = favoriteIds.has(recipe.id) ? 3 : 1;
    const rating = ratings.get(recipe.id);
    const ratingMultiplier = rating === 1 ? 2 : rating === -1 ? 0.15 : 1;
    const repeatPenalty = 1 + (usageCount.get(recipe.id) || 0);
    return (favoriteBoost * ratingMultiplier * templateMultiplier(recipe, pool, template)) / repeatPenalty;
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
export function generatePlan({
  diets = [],
  favoriteRecipeIds = [],
  householdSize = 2,
  customRecipes = [],
  ratings = new Map(),
  template = null,
}) {
  const favoriteIds = new Set(favoriteRecipeIds);
  const usageCount = new Map();
  const items = [];

  for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
    for (const mealType of MEAL_TYPES) {
      const pool = findRecipesWithExtra({ mealType, diets }, customRecipes);
      if (pool.length === 0) {
        items.push({ dayIndex, mealType, recipeId: null, servingsMultiplier: 1 });
        continue;
      }
      const recipe = weightedPick(pool, favoriteIds, usageCount, ratings, template);
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
export function generateSingleMeal({
  diets = [],
  favoriteRecipeIds = [],
  householdSize = 2,
  mealType,
  excludeRecipeId,
  customRecipes = [],
  ratings = new Map(),
  template = null,
}) {
  const favoriteIds = new Set(favoriteRecipeIds);
  let pool = findRecipesWithExtra({ mealType, diets }, customRecipes);
  if (pool.length === 0) {
    return { recipeId: null, servingsMultiplier: 1 };
  }
  if (pool.length > 1 && excludeRecipeId) {
    pool = pool.filter((r) => r.id !== excludeRecipeId);
  }
  const recipe = weightedPick(pool, favoriteIds, new Map(), ratings, template);
  return { recipeId: recipe.id, servingsMultiplier: householdSize / recipe.baseServings };
}

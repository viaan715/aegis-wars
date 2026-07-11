import { getRecipeByIdWithExtra } from '../data/recipeStore.js';

export function key(name, unit) {
  return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

/**
 * Aggregates ingredients across all meal plan items, scales by each meal's
 * servings multiplier, and subtracts matching pantry stock (same name+unit).
 */
export function buildGroceryList(mealPlanItems, pantryItems = [], customRecipes = []) {
  const totals = new Map();

  for (const item of mealPlanItems) {
    if (!item.recipeId) continue;
    const recipe = getRecipeByIdWithExtra(item.recipeId, customRecipes);
    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const scaledQty = ingredient.quantity * item.servingsMultiplier;
      const k = key(ingredient.name, ingredient.unit);
      const existing = totals.get(k);
      if (existing) {
        existing.quantity += scaledQty;
      } else {
        totals.set(k, {
          name: ingredient.name,
          unit: ingredient.unit,
          category: ingredient.category,
          quantity: scaledQty,
        });
      }
    }
  }

  const pantryByKey = new Map(
    pantryItems.map((p) => [key(p.ingredient_name, p.unit), p.quantity])
  );

  const result = [];
  for (const [k, entry] of totals) {
    const haveInPantry = pantryByKey.get(k) || 0;
    const needed = Math.max(0, entry.quantity - haveInPantry);
    result.push({
      name: entry.name,
      unit: entry.unit,
      category: entry.category,
      quantity: Math.round(needed * 100) / 100,
      quantityBeforePantry: Math.round(entry.quantity * 100) / 100,
    });
  }

  return result
    .filter((r) => r.quantity > 0)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

/**
 * Per-person nutrition totals. Recipe nutrition values are already
 * per-serving, and each person eats one serving of each planned meal
 * regardless of household size, so no servings-multiplier scaling applies
 * here (that multiplier only scales the grocery list quantities).
 */
export function summarizeNutrition(mealPlanItems, customRecipes = []) {
  const perDay = Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }));
  const week = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const item of mealPlanItems) {
    if (!item.recipeId) continue;
    const recipe = getRecipeByIdWithExtra(item.recipeId, customRecipes);
    if (!recipe) continue;

    const day = perDay[item.dayIndex];
    day.calories += recipe.nutrition.calories;
    day.protein += recipe.nutrition.protein;
    day.carbs += recipe.nutrition.carbs;
    day.fat += recipe.nutrition.fat;
  }

  for (const day of perDay) {
    day.calories = Math.round(day.calories);
    day.protein = Math.round(day.protein);
    day.carbs = Math.round(day.carbs);
    day.fat = Math.round(day.fat);
    week.calories += day.calories;
    week.protein += day.protein;
    week.carbs += day.carbs;
    week.fat += day.fat;
  }

  return { perDay, week };
}

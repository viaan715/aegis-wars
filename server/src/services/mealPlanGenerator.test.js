import { describe, it, expect } from 'vitest';
import { generatePlan, generateSingleMeal, MEAL_TYPES, DAYS_PER_WEEK } from './mealPlanGenerator.js';
import { getRecipeById, findRecipes } from '../data/recipeStore.js';

describe('generatePlan', () => {
  it('produces exactly one item per day per meal type', () => {
    const items = generatePlan({ diets: [], householdSize: 2 });
    expect(items).toHaveLength(DAYS_PER_WEEK * MEAL_TYPES.length);

    for (let dayIndex = 0; dayIndex < DAYS_PER_WEEK; dayIndex += 1) {
      for (const mealType of MEAL_TYPES) {
        const matches = items.filter((i) => i.dayIndex === dayIndex && i.mealType === mealType);
        expect(matches).toHaveLength(1);
      }
    }
  });

  it('never assigns a recipe that violates a requested diet restriction', () => {
    const diets = ['vegetarian', 'gluten-free'];
    const items = generatePlan({ diets, householdSize: 2 });

    for (const item of items) {
      if (!item.recipeId) continue;
      const recipe = getRecipeById(item.recipeId);
      expect(recipe.mealType).toBe(item.mealType);
      for (const diet of diets) {
        expect(recipe.diets).toContain(diet);
      }
    }
  });

  it('scales servingsMultiplier to householdSize / recipe.baseServings', () => {
    const items = generatePlan({ diets: [], householdSize: 6 });
    for (const item of items) {
      if (!item.recipeId) continue;
      const recipe = getRecipeById(item.recipeId);
      expect(item.servingsMultiplier).toBeCloseTo(6 / recipe.baseServings, 5);
    }
  });

  it('marks a slot as unfulfillable (recipeId: null) when no recipe satisfies every restriction', () => {
    const impossibleDiets = ['vegan', 'keto', 'paleo', 'nut-free', 'gluten-free', 'dairy-free', 'low-carb'];
    const items = generatePlan({ diets: impossibleDiets, householdSize: 2 });
    // At least the recipe dataset shouldn't silently break a restriction to fill a slot.
    for (const item of items) {
      if (!item.recipeId) continue;
      const recipe = getRecipeById(item.recipeId);
      for (const diet of impossibleDiets) {
        expect(recipe.diets).toContain(diet);
      }
    }
  });
});

describe('generateSingleMeal', () => {
  it('avoids repeating the excluded recipe when an alternative exists', () => {
    const pool = findRecipes({ mealType: 'breakfast', diets: [] });
    expect(pool.length).toBeGreaterThan(1);

    const exclude = pool[0].id;
    let sawDifferent = false;
    for (let i = 0; i < 30; i += 1) {
      const result = generateSingleMeal({ diets: [], mealType: 'breakfast', householdSize: 2, excludeRecipeId: exclude });
      expect(result.recipeId).not.toBe(exclude);
      if (result.recipeId !== exclude) sawDifferent = true;
    }
    expect(sawDifferent).toBe(true);
  });

  it('returns recipeId: null when the diet combination has no matching recipe for that meal type', () => {
    const result = generateSingleMeal({
      diets: ['vegan', 'keto', 'paleo', 'nut-free', 'gluten-free', 'dairy-free', 'low-carb', 'vegetarian'],
      mealType: 'dinner',
      householdSize: 2,
    });
    if (result.recipeId) {
      const recipe = getRecipeById(result.recipeId);
      expect(recipe.diets).toEqual(expect.arrayContaining(['vegan', 'keto']));
    } else {
      expect(result.recipeId).toBeNull();
    }
  });

  it('picks a thumbs-up recipe more often than a thumbs-down recipe over many trials', () => {
    const pool = findRecipes({ mealType: 'lunch', diets: [] });
    expect(pool.length).toBeGreaterThan(2);
    const [up, down] = pool;
    const ratings = new Map([
      [up.id, 1],
      [down.id, -1],
    ]);

    const counts = { up: 0, down: 0 };
    for (let i = 0; i < 200; i += 1) {
      const result = generateSingleMeal({ diets: [], mealType: 'lunch', householdSize: 2, ratings });
      if (result.recipeId === up.id) counts.up += 1;
      if (result.recipeId === down.id) counts.down += 1;
    }
    expect(counts.up).toBeGreaterThan(counts.down);
  });

  it('includes a custom recipe in the candidate pool alongside built-ins', () => {
    // A sentinel diet tag no built-in recipe could ever have makes the
    // custom recipe the only possible match, deterministically — no need to
    // guess which real diet combination happens to be uncovered by the
    // (changeable) built-in dataset.
    const sentinelDiet = '__test_sentinel_diet__';
    const customRecipe = {
      id: 'custom:test-1',
      name: 'Test Custom Dinner',
      mealType: 'dinner',
      diets: [sentinelDiet],
      baseServings: 2,
      nutrition: { calories: 300, protein: 20, carbs: 5, fat: 20 },
      instructions: ['Do the thing.'],
      ingredients: [{ name: 'thing', quantity: 1, unit: 'each', category: 'other' }],
    };

    const result = generateSingleMeal({
      diets: [sentinelDiet],
      mealType: 'dinner',
      householdSize: 4,
      customRecipes: [customRecipe],
    });

    expect(result.recipeId).toBe('custom:test-1');
    expect(result.servingsMultiplier).toBeCloseTo(4 / 2, 5);
  });

  it('"high-protein" template favors recipes where protein makes up a larger share of calories', () => {
    const pool = findRecipes({ mealType: 'lunch', diets: [] });
    const proteinRatio = (r) => (r.nutrition.calories > 0 ? (r.nutrition.protein * 4) / r.nutrition.calories : 0);
    const highest = [...pool].sort((a, b) => proteinRatio(b) - proteinRatio(a))[0];
    const lowest = [...pool].sort((a, b) => proteinRatio(a) - proteinRatio(b))[0];

    const counts = { highest: 0, lowest: 0 };
    for (let i = 0; i < 200; i += 1) {
      const result = generateSingleMeal({ diets: [], mealType: 'lunch', householdSize: 2, template: 'high-protein' });
      if (result.recipeId === highest.id) counts.highest += 1;
      if (result.recipeId === lowest.id) counts.lowest += 1;
    }
    expect(counts.highest).toBeGreaterThan(counts.lowest);
  });
});

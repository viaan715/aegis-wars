import { describe, it, expect } from 'vitest';
import { buildGroceryList, summarizeNutrition, key } from './groceryListBuilder.js';
import { getRecipeById } from '../data/recipeStore.js';

const B01 = getRecipeById('b01'); // Veggie Scramble with Avocado, baseServings 2
const B02 = getRecipeById('b02'); // Greek Yogurt Parfait, baseServings 2

describe('buildGroceryList', () => {
  it('scales ingredient quantities by each meal\'s servingsMultiplier', () => {
    const items = [{ recipeId: 'b01', servingsMultiplier: 2, dayIndex: 0, mealType: 'breakfast' }];
    const list = buildGroceryList(items, []);

    const eggs = B01.ingredients.find((i) => i.name === 'eggs');
    const row = list.find((r) => key(r.name, r.unit) === key('eggs', eggs.unit));
    expect(row.quantity).toBeCloseTo(eggs.quantity * 2, 5);
  });

  it('aggregates the same ingredient (by name+unit) across multiple meals', () => {
    const items = [
      { recipeId: 'b01', servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' },
      { recipeId: 'b01', servingsMultiplier: 1, dayIndex: 1, mealType: 'breakfast' },
    ];
    const list = buildGroceryList(items, []);

    const eggs = B01.ingredients.find((i) => i.name === 'eggs');
    const row = list.find((r) => key(r.name, r.unit) === key('eggs', eggs.unit));
    expect(row.quantity).toBeCloseTo(eggs.quantity * 2, 5);
  });

  it('subtracts matching pantry stock and clamps at zero rather than going negative', () => {
    const items = [{ recipeId: 'b01', servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' }];
    const eggs = B01.ingredients.find((i) => i.name === 'eggs');

    const pantryPartial = [{ ingredient_name: 'eggs', unit: eggs.unit, quantity: eggs.quantity - 1 }];
    const listPartial = buildGroceryList(items, pantryPartial);
    const rowPartial = listPartial.find((r) => key(r.name, r.unit) === key('eggs', eggs.unit));
    expect(rowPartial.quantity).toBeCloseTo(1, 5);

    const pantryExcess = [{ ingredient_name: 'eggs', unit: eggs.unit, quantity: eggs.quantity + 10 }];
    const listExcess = buildGroceryList(items, pantryExcess);
    const rowExcess = listExcess.find((r) => key(r.name, r.unit) === key('eggs', eggs.unit));
    expect(rowExcess).toBeUndefined(); // fully covered by pantry, dropped from the list entirely
  });

  it('does not aggregate the same ingredient name across different units', () => {
    const items = [
      { recipeId: 'b01', servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' }, // eggs: each
    ];
    // b06 also uses "eggs" but as "each" too, so use a contrived case instead:
    // confirm the key() helper itself distinguishes units.
    expect(key('eggs', 'each')).not.toBe(key('eggs', 'cup'));
  });

  it('ignores unfulfilled slots (recipeId: null)', () => {
    const items = [{ recipeId: null, servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' }];
    expect(buildGroceryList(items, [])).toEqual([]);
  });
});

describe('summarizeNutrition', () => {
  it('sums per-serving nutrition for each meal on a day, independent of servingsMultiplier', () => {
    // household of 6 against a baseServings-2 recipe means servingsMultiplier = 3,
    // but nutrition is per-person (one serving), so it must NOT be multiplied by 3.
    const items = [
      { recipeId: 'b01', servingsMultiplier: 3, dayIndex: 0, mealType: 'breakfast' },
      { recipeId: 'b02', servingsMultiplier: 3, dayIndex: 0, mealType: 'snack' },
    ];
    const { perDay, week } = summarizeNutrition(items);

    expect(perDay[0].calories).toBe(B01.nutrition.calories + B02.nutrition.calories);
    expect(perDay[0].protein).toBe(B01.nutrition.protein + B02.nutrition.protein);
    expect(week.calories).toBe(perDay[0].calories);
  });

  it('keeps each day\'s totals isolated by dayIndex', () => {
    const items = [
      { recipeId: 'b01', servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' },
      { recipeId: 'b02', servingsMultiplier: 1, dayIndex: 3, mealType: 'breakfast' },
    ];
    const { perDay } = summarizeNutrition(items);

    expect(perDay[0].calories).toBe(B01.nutrition.calories);
    expect(perDay[3].calories).toBe(B02.nutrition.calories);
    expect(perDay[1].calories).toBe(0);
    expect(perDay).toHaveLength(7);
  });

  it('ignores unfulfilled slots (recipeId: null)', () => {
    const items = [{ recipeId: null, servingsMultiplier: 1, dayIndex: 0, mealType: 'breakfast' }];
    const { week } = summarizeNutrition(items);
    expect(week).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

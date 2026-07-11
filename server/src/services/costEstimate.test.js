import { describe, it, expect } from 'vitest';
import { estimateRecipeCost, estimateGroceryListCost, CATEGORY_ESTIMATED_PRICE } from './costEstimate.js';
import { getRecipeById } from '../data/recipeStore.js';

describe('estimateRecipeCost', () => {
  it('sums one flat category price per ingredient, regardless of quantity/unit', () => {
    const recipe = getRecipeById('b01'); // eggs, bell pepper, baby spinach, avocado, olive oil
    const expected = recipe.ingredients.reduce(
      (sum, ing) => sum + (CATEGORY_ESTIMATED_PRICE[ing.category] ?? CATEGORY_ESTIMATED_PRICE.other),
      0
    );
    expect(estimateRecipeCost(recipe)).toBeCloseTo(expected, 5);
  });
});

describe('estimateGroceryListCost', () => {
  it('sums per-category and total across grocery list line items', () => {
    const items = [
      { category: 'produce', name: 'avocado' },
      { category: 'produce', name: 'spinach' },
      { category: 'dairy', name: 'milk' },
    ];
    const { perCategory, total } = estimateGroceryListCost(items);
    expect(perCategory.produce).toBeCloseTo(CATEGORY_ESTIMATED_PRICE.produce * 2, 5);
    expect(perCategory.dairy).toBeCloseTo(CATEGORY_ESTIMATED_PRICE.dairy, 5);
    expect(total).toBeCloseTo(CATEGORY_ESTIMATED_PRICE.produce * 2 + CATEGORY_ESTIMATED_PRICE.dairy, 5);
  });

  it('falls back to the "other" price for an unrecognized category', () => {
    const { total } = estimateGroceryListCost([{ category: 'mystery', name: 'thing' }]);
    expect(total).toBeCloseTo(CATEGORY_ESTIMATED_PRICE.other, 5);
  });

  it('returns zero total for an empty list', () => {
    expect(estimateGroceryListCost([])).toEqual({ perCategory: {}, total: 0 });
  });
});

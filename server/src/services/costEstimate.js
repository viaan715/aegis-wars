// Rough per-category price estimates — NOT real store pricing. There's no
// pricing API wired up, so this assigns one flat estimated price per grocery
// line item based on its aisle category, regardless of exact quantity/unit
// (grocery items are typically bought as whole packages anyway, so "a dozen
// eggs" and "6 eggs" cost about the same to buy). Good for a rough weekly
// ballpark, not a receipt.
export const CATEGORY_ESTIMATED_PRICE = {
  produce: 2.0,
  dairy: 4.0,
  meat: 8.0,
  seafood: 10.0,
  bakery: 4.0,
  pantry: 3.0,
  frozen: 5.0,
  spices: 2.5,
  other: 4.0,
};

function priceForCategory(category) {
  return CATEGORY_ESTIMATED_PRICE[category] ?? CATEGORY_ESTIMATED_PRICE.other;
}

export function estimateRecipeCost(recipe) {
  return recipe.ingredients.reduce((sum, ing) => sum + priceForCategory(ing.category), 0);
}

export function estimateGroceryListCost(groceryItems) {
  const perCategory = {};
  let total = 0;
  for (const item of groceryItems) {
    const price = priceForCategory(item.category);
    perCategory[item.category] = (perCategory[item.category] || 0) + price;
    total += price;
  }
  for (const category of Object.keys(perCategory)) {
    perCategory[category] = Math.round(perCategory[category] * 100) / 100;
  }
  return { perCategory, total: Math.round(total * 100) / 100 };
}

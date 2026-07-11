import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const recipes = JSON.parse(fs.readFileSync(path.join(__dirname, 'recipes.json'), 'utf8'));

const byId = new Map(recipes.map((r) => [r.id, r]));

export function getAllRecipes() {
  return recipes;
}

export function getRecipeById(id) {
  return byId.get(id) || null;
}

export function findRecipes({ mealType, diets = [] } = {}) {
  return recipes.filter((r) => {
    if (mealType && r.mealType !== mealType) return false;
    return diets.every((d) => r.diets.includes(d));
  });
}

/** Same as findRecipes/getRecipeById, but also searches a caller-supplied
 * list (a user's custom recipes) alongside the built-in dataset. Kept
 * separate from the functions above so built-in-only lookups (and the
 * existing tests against them) are unaffected. */
export function findRecipesWithExtra({ mealType, diets = [] } = {}, extraRecipes = []) {
  return [...recipes, ...extraRecipes].filter((r) => {
    if (mealType && r.mealType !== mealType) return false;
    return diets.every((d) => r.diets.includes(d));
  });
}

export function getRecipeByIdWithExtra(id, extraRecipes = []) {
  return byId.get(id) || extraRecipes.find((r) => r.id === id) || null;
}

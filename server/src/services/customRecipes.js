import crypto from 'crypto';
import db from '../db/index.js';
import { MEAL_TYPES } from './mealPlanGenerator.js';
import { sanitizeDiets } from '../utils/dietRestrictions.js';

const CATEGORIES = ['produce', 'dairy', 'meat', 'seafood', 'bakery', 'pantry', 'frozen', 'spices', 'other'];

function rowToRecipe(row) {
  return {
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    diets: JSON.parse(row.diets),
    baseServings: row.base_servings,
    nutrition: JSON.parse(row.nutrition),
    instructions: JSON.parse(row.instructions),
    ingredients: JSON.parse(row.ingredients),
    isCustom: true,
    ownerId: row.user_id,
  };
}

export function getCustomRecipesForUser(userId) {
  return db.prepare('SELECT * FROM custom_recipes WHERE user_id = ?').all(userId).map(rowToRecipe);
}

export function getCustomRecipeById(userId, id) {
  const row = db.prepare('SELECT * FROM custom_recipes WHERE id = ? AND user_id = ?').get(id, userId);
  return row ? rowToRecipe(row) : null;
}

/** Validates and normalizes a custom recipe payload. Throws with a user-facing message on invalid input. */
export function validateCustomRecipeInput(body) {
  const { name, mealType, baseServings, ingredients, instructions, nutrition, diets } = body;

  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('name is required');
  }
  if (!MEAL_TYPES.includes(mealType)) {
    throw new Error(`mealType must be one of: ${MEAL_TYPES.join(', ')}`);
  }
  if (!Number.isFinite(baseServings) || baseServings <= 0) {
    throw new Error('baseServings must be a positive number');
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new Error('ingredients must be a non-empty array');
  }
  for (const ing of ingredients) {
    if (typeof ing.name !== 'string' || !ing.name.trim()) {
      throw new Error('every ingredient needs a name');
    }
    if (!Number.isFinite(ing.quantity) || ing.quantity <= 0) {
      throw new Error(`ingredient "${ing.name}" needs a positive quantity`);
    }
    if (typeof ing.unit !== 'string' || !ing.unit.trim()) {
      throw new Error(`ingredient "${ing.name}" needs a unit`);
    }
    if (!CATEGORIES.includes(ing.category)) {
      throw new Error(`ingredient "${ing.name}" category must be one of: ${CATEGORIES.join(', ')}`);
    }
  }
  if (!Array.isArray(instructions) || instructions.some((s) => typeof s !== 'string' || !s.trim())) {
    throw new Error('instructions must be an array of non-empty strings');
  }
  const n = nutrition || {};
  for (const key of ['calories', 'protein', 'carbs', 'fat']) {
    if (!Number.isFinite(n[key]) || n[key] < 0) {
      throw new Error(`nutrition.${key} must be a non-negative number`);
    }
  }

  return {
    name: name.trim(),
    mealType,
    baseServings: Math.round(baseServings),
    diets: sanitizeDiets(diets),
    ingredients: ingredients.map((ing) => ({
      name: ing.name.trim(),
      quantity: ing.quantity,
      unit: ing.unit.trim(),
      category: ing.category,
    })),
    instructions: instructions.map((s) => s.trim()),
    nutrition: {
      calories: Math.round(n.calories),
      protein: Math.round(n.protein),
      carbs: Math.round(n.carbs),
      fat: Math.round(n.fat),
    },
  };
}

export function createCustomRecipe(userId, input) {
  const id = `custom:${crypto.randomUUID()}`;
  db.prepare(
    `INSERT INTO custom_recipes (id, user_id, name, meal_type, diets, base_servings, nutrition, instructions, ingredients)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.mealType,
    JSON.stringify(input.diets),
    input.baseServings,
    JSON.stringify(input.nutrition),
    JSON.stringify(input.instructions),
    JSON.stringify(input.ingredients)
  );
  return getCustomRecipeById(userId, id);
}

export function deleteCustomRecipe(userId, id) {
  const result = db.prepare('DELETE FROM custom_recipes WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

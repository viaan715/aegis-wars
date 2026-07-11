import express from 'express';
import { getAllRecipes, getRecipeByIdWithExtra } from '../data/recipeStore.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getCustomRecipesForUser,
  validateCustomRecipeInput,
  createCustomRecipe,
  deleteCustomRecipe,
} from '../services/customRecipes.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const { q, diet, mealType } = req.query;
  const diets = diet ? String(diet).split(',').filter(Boolean) : [];
  const all = [...getAllRecipes(), ...getCustomRecipesForUser(req.user.id)];

  const filtered = all.filter((r) => {
    if (mealType && r.mealType !== mealType) return false;
    if (diets.length > 0 && !diets.every((d) => r.diets.includes(d))) return false;
    if (q && !r.name.toLowerCase().includes(String(q).toLowerCase())) return false;
    return true;
  });

  res.json({ recipes: filtered });
});

router.post('/', requireAuth, (req, res) => {
  let input;
  try {
    input = validateCustomRecipeInput(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const recipe = createCustomRecipe(req.user.id, input);
  res.status(201).json({ recipe });
});

router.get('/:id', requireAuth, (req, res) => {
  const recipe = getRecipeByIdWithExtra(req.params.id, getCustomRecipesForUser(req.user.id));
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ recipe });
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!req.params.id.startsWith('custom:')) {
    return res.status(400).json({ error: 'Only custom recipes can be deleted' });
  }
  const deleted = deleteCustomRecipe(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Recipe not found' });
  res.status(204).end();
});

export default router;

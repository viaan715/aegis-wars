import express from 'express';
import { getAllRecipes, getRecipeById } from '../data/recipeStore.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({ recipes: getAllRecipes() });
});

router.get('/:id', (req, res) => {
  const recipe = getRecipeById(req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ recipe });
});

export default router;

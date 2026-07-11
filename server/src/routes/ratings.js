import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getRecipeByIdWithExtra } from '../data/recipeStore.js';
import { getCustomRecipesForUser } from '../services/customRecipes.js';
import { getRatingsForUser, setRating, clearRating } from '../services/ratings.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json({ ratings: getRatingsForUser(req.user.id) });
});

router.put('/:recipeId', requireAuth, (req, res) => {
  const { rating } = req.body;
  if (rating !== 1 && rating !== -1) {
    return res.status(400).json({ error: 'rating must be 1 (up) or -1 (down)' });
  }
  const recipe = getRecipeByIdWithExtra(req.params.recipeId, getCustomRecipesForUser(req.user.id));
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  setRating(req.user.id, req.params.recipeId, rating);
  res.json({ recipeId: req.params.recipeId, rating });
});

router.delete('/:recipeId', requireAuth, (req, res) => {
  clearRating(req.user.id, req.params.recipeId);
  res.status(204).end();
});

export default router;

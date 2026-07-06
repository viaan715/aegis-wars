import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { getRecipeById } from '../data/recipeStore.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT recipe_id FROM favorites WHERE user_id = ?').all(req.user.id);
  const recipes = rows.map((r) => getRecipeById(r.recipe_id)).filter(Boolean);
  res.json({ favorites: recipes });
});

router.post('/', requireAuth, (req, res) => {
  const { recipeId } = req.body;
  const recipe = getRecipeById(recipeId);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

  db.prepare('INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(
    req.user.id,
    recipeId
  );
  res.status(201).json({ recipe });
});

router.delete('/:recipeId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(
    req.user.id,
    req.params.recipeId
  );
  res.status(204).end();
});

export default router;

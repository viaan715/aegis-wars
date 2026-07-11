import db from '../db/index.js';

export function getRatingsForUser(userId) {
  return db.prepare('SELECT recipe_id, rating FROM recipe_ratings WHERE user_id = ?').all(userId);
}

export function getRatingsMapForUser(userId) {
  const map = new Map();
  for (const row of getRatingsForUser(userId)) {
    map.set(row.recipe_id, row.rating);
  }
  return map;
}

export function setRating(userId, recipeId, rating) {
  db.prepare(
    `INSERT INTO recipe_ratings (user_id, recipe_id, rating) VALUES (?, ?, ?)
     ON CONFLICT(user_id, recipe_id) DO UPDATE SET rating = excluded.rating`
  ).run(userId, recipeId, rating);
}

export function clearRating(userId, recipeId) {
  db.prepare('DELETE FROM recipe_ratings WHERE user_id = ? AND recipe_id = ?').run(userId, recipeId);
}

import express from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function serialize(row) {
  return { id: row.id, ingredientName: row.ingredient_name, quantity: row.quantity, unit: row.unit };
}

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM pantry_items WHERE user_id = ? ORDER BY ingredient_name')
    .all(req.user.id);
  res.json({ pantryItems: rows.map(serialize) });
});

router.post('/', requireAuth, (req, res) => {
  const { ingredientName, quantity, unit } = req.body;
  if (!ingredientName || typeof quantity !== 'number' || quantity < 0 || !unit) {
    return res.status(400).json({ error: 'ingredientName, quantity (>= 0), and unit are required' });
  }

  const existing = db
    .prepare('SELECT * FROM pantry_items WHERE user_id = ? AND ingredient_name = ? AND unit = ?')
    .get(req.user.id, ingredientName, unit);

  let row;
  if (existing) {
    db.prepare('UPDATE pantry_items SET quantity = ? WHERE id = ?').run(quantity, existing.id);
    row = db.prepare('SELECT * FROM pantry_items WHERE id = ?').get(existing.id);
  } else {
    const result = db
      .prepare('INSERT INTO pantry_items (user_id, ingredient_name, quantity, unit) VALUES (?, ?, ?, ?)')
      .run(req.user.id, ingredientName, quantity, unit);
    row = db.prepare('SELECT * FROM pantry_items WHERE id = ?').get(result.lastInsertRowid);
  }

  res.status(201).json({ pantryItem: serialize(row) });
});

router.patch('/:id', requireAuth, (req, res) => {
  const { quantity } = req.body;
  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'quantity (>= 0) is required' });
  }
  const row = db
    .prepare('SELECT * FROM pantry_items WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'Pantry item not found' });

  db.prepare('UPDATE pantry_items SET quantity = ? WHERE id = ?').run(quantity, row.id);
  res.json({ pantryItem: serialize({ ...row, quantity }) });
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db
    .prepare('DELETE FROM pantry_items WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pantry item not found' });
  res.status(204).end();
});

export default router;

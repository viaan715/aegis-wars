import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import recipeRoutes from './routes/recipes.js';
import mealPlanRoutes from './routes/mealplans.js';
import groceryRoutes from './routes/grocery.js';
import pantryRoutes from './routes/pantry.js';
import favoriteRoutes from './routes/favorites.js';
import instacartRoutes from './routes/instacart.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy server/.env.example to server/.env and set it.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/mealplans', mealPlanRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/instacart', instacartRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Meal planner API listening on port ${PORT}`);
});

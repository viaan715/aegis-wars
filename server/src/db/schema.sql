CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  name TEXT NOT NULL,
  household_size INTEGER NOT NULL DEFAULT 2,
  diet_restrictions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS pantry_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'each',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, ingredient_name, unit)
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date TEXT NOT NULL,
  household_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meal_plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  servings_multiplier REAL NOT NULL DEFAULT 1,
  UNIQUE(meal_plan_id, day_index, meal_type)
);

CREATE TABLE IF NOT EXISTS grocery_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan ON meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_plan ON grocery_list_items(meal_plan_id);

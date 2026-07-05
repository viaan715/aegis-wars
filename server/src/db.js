import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'formforge.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    credits INTEGER NOT NULL DEFAULT 20,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    slug TEXT UNIQUE NOT NULL,
    layout TEXT NOT NULL DEFAULT 'typeform',
    theme_color TEXT NOT NULL DEFAULT '#c99a46',
    status TEXT NOT NULL DEFAULT 'draft',
    thank_you_title TEXT NOT NULL DEFAULT 'Thanks — that''s recorded.',
    thank_you_message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    options TEXT NOT NULL DEFAULT '[]',
    required INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_forms_user ON forms(user_id);
  CREATE INDEX IF NOT EXISTS idx_questions_form ON questions(form_id);
  CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form_id);
  CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);
`);

const formColumns = new Set(db.prepare('PRAGMA table_info(forms)').all().map((c) => c.name));
if (!formColumns.has('thank_you_title')) {
  db.exec(`ALTER TABLE forms ADD COLUMN thank_you_title TEXT NOT NULL DEFAULT 'Thanks — that''s recorded.'`);
}
if (!formColumns.has('thank_you_message')) {
  db.exec(`ALTER TABLE forms ADD COLUMN thank_you_message TEXT NOT NULL DEFAULT ''`);
}

const userColumns = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
if (!userColumns.has('credits')) {
  db.exec(`ALTER TABLE users ADD COLUMN credits INTEGER NOT NULL DEFAULT 20`);
}

export default db;

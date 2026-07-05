import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required, e.g. postgres://user:pass@host:5432/dbname');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function queryOne(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

export async function queryAll(sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

// Runs `fn` against a single dedicated client wrapped in BEGIN/COMMIT/ROLLBACK —
// pool.query() alone can't be used for multi-statement transactions since each
// call may be served by a different pooled connection.
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      credits INTEGER NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS forms (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      slug TEXT UNIQUE NOT NULL,
      layout TEXT NOT NULL DEFAULT 'typeform',
      theme_color TEXT NOT NULL DEFAULT '#c99a46',
      status TEXT NOT NULL DEFAULT 'draft',
      thank_you_title TEXT NOT NULL DEFAULT 'Thanks — that''s recorded.',
      thank_you_message TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      options TEXT NOT NULL DEFAULT '[]',
      required BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_forms_user ON forms(user_id);
    CREATE INDEX IF NOT EXISTS idx_questions_form ON questions(form_id);
    CREATE INDEX IF NOT EXISTS idx_responses_form ON responses(form_id);
    CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);
  `);

  // One-time top-up: the starter balance was raised from 20 to 100 credits
  // after this column first shipped — bump any free-plan account still
  // sitting at the old default so existing accounts aren't stuck below what
  // a new signup gets.
  await pool.query("UPDATE users SET credits = 100 WHERE plan = 'free' AND credits = 20");
}

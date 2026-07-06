import { beforeEach } from 'vitest';

process.env.DATABASE_URL = 'postgres://test:test@localhost/test'; // pg-mem ignores this, just needs to be non-empty
process.env.JWT_SECRET = 'test-secret-not-for-production';

const { initDb, pool } = await import('../src/db.js');
await initDb();

// Cascading FK deletes clear forms/questions/responses/answers along with users.
beforeEach(async () => {
  await pool.query('DELETE FROM users');
});

// Stands in for the real 'pg' package during tests (aliased in vitest.config.js)
// so the whole app can be exercised through real SQL without a real Postgres
// server — pg-mem is an in-memory engine that understands enough Postgres SQL
// to run our actual schema and queries.
import { newDb } from 'pg-mem';

const mem = newDb({ autoCreateForeignKeyIndices: true });
mem.public.registerFunction({
  name: 'now',
  returns: 'timestamptz',
  implementation: () => new Date(),
});

const { Pool } = mem.adapters.createPg();

export default { Pool };
export { Pool };

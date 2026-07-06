import { describe, it, expect } from 'vitest';
import { chargeCredits, refundCredits, hasUnlimitedCredits, CREDIT_COSTS } from '../src/credits.js';
import { pool } from '../src/db.js';

async function insertUser(plan, credits) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, name, plan, credits) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [`${Math.random()}@example.com`, 'hash', 'Test', plan, credits]
  );
  return rows[0];
}

describe('credits', () => {
  it('hasUnlimitedCredits is true only for pro', () => {
    expect(hasUnlimitedCredits('pro')).toBe(true);
    expect(hasUnlimitedCredits('free')).toBe(false);
  });

  it('charges the exact cost for a known action', async () => {
    const user = await insertUser('free', 100);
    const result = await chargeCredits(user, 'createForm');
    expect(result.ok).toBe(true);
    expect(result.cost).toBe(CREDIT_COSTS.createForm);

    const { rows } = await pool.query('SELECT credits FROM users WHERE id = $1', [user.id]);
    expect(rows[0].credits).toBe(100 - CREDIT_COSTS.createForm);
  });

  it('refuses to charge below zero', async () => {
    const user = await insertUser('free', 2);
    const result = await chargeCredits(user, 'createForm'); // costs 5
    expect(result.ok).toBe(false);
    expect(result.cost).toBe(5);

    const { rows } = await pool.query('SELECT credits FROM users WHERE id = $1', [user.id]);
    expect(rows[0].credits).toBe(2); // untouched
  });

  it('pro accounts are never charged', async () => {
    const user = await insertUser('pro', 0);
    const result = await chargeCredits(user, 'createForm');
    expect(result.ok).toBe(true);
    expect(result.cost).toBe(0);

    const { rows } = await pool.query('SELECT credits FROM users WHERE id = $1', [user.id]);
    expect(rows[0].credits).toBe(0);
  });

  it('refundCredits adds the cost back for a free user', async () => {
    const user = await insertUser('free', 90);
    await refundCredits(user, 5);
    const { rows } = await pool.query('SELECT credits FROM users WHERE id = $1', [user.id]);
    expect(rows[0].credits).toBe(95);
  });

  it('refundCredits is a no-op for pro accounts or a zero cost', async () => {
    const user = await insertUser('pro', 10);
    await refundCredits(user, 0);
    await refundCredits(user, 5); // pro — should still be a no-op
    const { rows } = await pool.query('SELECT credits FROM users WHERE id = $1', [user.id]);
    expect(rows[0].credits).toBe(10);
  });
});

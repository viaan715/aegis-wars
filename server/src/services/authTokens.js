import crypto from 'crypto';
import db from '../db/index.js';

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function futureIso(ms) {
  return new Date(Date.now() + ms).toISOString();
}

export function createVerificationToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    userId,
    token,
    futureIso(VERIFY_TOKEN_TTL_MS)
  );
  return token;
}

export function consumeVerificationToken(token) {
  const row = db.prepare('SELECT * FROM email_verification_tokens WHERE token = ?').get(token);
  if (!row) return null;
  db.prepare('DELETE FROM email_verification_tokens WHERE token = ?').run(token);
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.user_id;
}

export function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    userId,
    token,
    futureIso(RESET_TOKEN_TTL_MS)
  );
  return token;
}

export function consumePasswordResetToken(token) {
  const row = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token);
  if (!row) return null;
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.user_id;
}

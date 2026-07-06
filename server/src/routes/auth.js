import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import db from '../db/index.js';
import { signToken } from '../utils/jwt.js';
import { publicUser } from '../utils/dietRestrictions.js';

const router = express.Router();

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
    .run(email.toLowerCase(), passwordHash, name);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/google', async (req, res) => {
  if (!googleClient) {
    return res.status(503).json({ error: 'Google Sign-In is not configured on this server' });
  }

  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'credential is required' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  const { sub: googleId, email, name } = payload;
  let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);

  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (user) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      const result = db
        .prepare('INSERT INTO users (email, google_id, name) VALUES (?, ?, ?)')
        .run(email.toLowerCase(), googleId, name || email);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

export default router;

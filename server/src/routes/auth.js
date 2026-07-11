import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import db from '../db/index.js';
import { signToken } from '../utils/jwt.js';
import { publicUser } from '../utils/dietRestrictions.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createVerificationToken,
  consumeVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} from '../services/authTokens.js';
import { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured } from '../services/emailService.js';

const router = express.Router();

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function sendVerificationEmailBestEffort(user) {
  if (!isEmailConfigured()) return;
  try {
    const token = createVerificationToken(user.id);
    const verifyUrl = `${CLIENT_ORIGIN}/verify-email?token=${token}`;
    await sendVerificationEmail(user.email, verifyUrl);
  } catch (err) {
    // Email is a nice-to-have here, not a hard requirement — signup/login must
    // keep working even if the email provider is down or misconfigured.
    console.error('Failed to send verification email:', err.message);
  }
}

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
  await sendVerificationEmailBestEffort(user);
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
      db.prepare('UPDATE users SET google_id = ?, email_verified = 1 WHERE id = ?').run(googleId, user.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // Google has already verified this address, so there's no need to send our own link.
      const result = db
        .prepare('INSERT INTO users (email, google_id, name, email_verified) VALUES (?, ?, ?, 1)')
        .run(email.toLowerCase(), googleId, name || email);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/resend-verification', requireAuth, async (req, res) => {
  if (req.user.email_verified) {
    return res.status(400).json({ error: 'Email is already verified' });
  }
  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'Email sending is not configured on this server' });
  }
  await sendVerificationEmailBestEffort(req.user);
  res.json({ message: 'Verification email sent' });
});

router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  const userId = consumeVerificationToken(token);
  if (!userId) {
    return res.status(400).json({ error: 'That verification link is invalid or has expired' });
  }

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
  res.json({ message: 'Email verified' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user && user.password_hash && isEmailConfigured()) {
    try {
      const token = createPasswordResetToken(user.id);
      const resetUrl = `${CLIENT_ORIGIN}/reset-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error('Failed to send password reset email:', err.message);
    }
  }
  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const userId = consumePasswordResetToken(token);
  if (!userId) {
    return res.status(400).json({ error: 'That reset link is invalid or has expired' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
  res.json({ message: 'Password updated' });
});

export default router;

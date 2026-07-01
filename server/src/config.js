import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

function loadOrCreateSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretPath = path.join(dataDir, 'jwt.secret');
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

export const JWT_SECRET = loadOrCreateSecret();
export const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

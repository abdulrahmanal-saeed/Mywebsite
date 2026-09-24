const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, one } = require('./db');

const COOKIE = 'admin_session';
// Used to spend the same time on unknown emails as on real ones.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

// Without SESSION_SECRET a random one is used, so logins reset on every restart.
const fallbackSecret = crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('[admin] SESSION_SECRET is not set; logins will reset on restart.');

function secret() {
  return process.env.SESSION_SECRET || fallbackSecret;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

// Token format: userId.expiresAt.passwordFingerprint.signature
// The fingerprint makes old sessions invalid after a password change.
function fingerprint(hash) {
  return crypto.createHash('sha256').update(hash).digest('base64url').slice(0, 12);
}

function makeToken(user) {
  const payload = `${user.id}.${Date.now() + MAX_AGE_MS}.${fingerprint(user.password_hash)}`;
  return `${payload}.${sign(payload)}`;
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

async function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [id, exp, fp, sig] = parts;
  const expected = sign(`${id}.${exp}.${fp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  const user = await one('SELECT id, email, password_hash FROM admin_users WHERE id = ?', [Number(id)]);
  if (!user || fingerprint(user.password_hash) !== fp) return null;
  return user;
}

function setSessionCookie(req, res, user) {
  res.cookie(COOKIE, makeToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

async function ensureAdmin() {
  const existing = await one('SELECT COUNT(*) AS n FROM admin_users');
  if (existing.n > 0) return;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 8) {
    console.warn('[admin] No admin user yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) and restart.');
    return;
  }
  await query('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)', [email, await bcrypt.hash(password, 12)]);
  console.log(`[admin] Created admin user ${email}`);
}

async function verifyLogin(email, password) {
  const user = await one('SELECT id, email, password_hash FROM admin_users WHERE email = ?', [
    String(email || '').trim().toLowerCase(),
  ]);
  if (!user) {
    await bcrypt.compare(String(password || ''), DUMMY_HASH);
    return null;
  }
  return (await bcrypt.compare(String(password || ''), user.password_hash)) ? user : null;
}

async function changePassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, userId]);
  return one('SELECT id, email, password_hash FROM admin_users WHERE id = ?', [userId]);
}

// Simple in-memory limiter: max `limit` hits per key within `windowMs`.
function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return function isLimited(key) {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > limit;
  };
}

module.exports = {
  userFromRequest,
  setSessionCookie,
  clearSessionCookie,
  ensureAdmin,
  verifyLogin,
  changePassword,
  rateLimiter,
};

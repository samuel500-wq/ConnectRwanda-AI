import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function sign(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/**
 * Normalize a JWT payload into a consistent user object.
 *
 * Different parts of the codebase (or older tokens issued before a change)
 * may have signed the user identifier under `id`, `userId`, `user_id`,
 * or `sub`. We accept any of those, coerce to a positive integer, and
 * expose it consistently as `user.id` and `user.userId`.
 *
 * Returns null if no valid identifier is found — the caller must then
 * reject the request. This prevents an invalid token from ever producing
 * `req.user.id === undefined` (or NaN), which would flow into SQL queries.
 */
function normalizeUser(decoded) {
  if (!decoded || typeof decoded !== 'object') return null;

  const candidates = [decoded.id, decoded.userId, decoded.user_id, decoded.sub];
  let id = null;

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      id = candidate;
      break;
    }
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) {
        id = parsed;
        break;
      }
    }
  }

  if (id === null) return null;

  return {
    ...decoded,
    id,
    userId: id,
    role: typeof decoded.role === 'string' ? decoded.role : null,
  };
}

function extractToken(req) {
  const hdr = req.headers.authorization || '';
  return hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
}

export function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'auth_required' });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = normalizeUser(decoded);
    if (!user) {
      return res.status(401).json({ error: 'invalid_token_payload' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
};

/** Optional auth: fills req.user if token is valid, else continues silently. */
export function optionalAuth(req, _res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = normalizeUser(decoded);
      if (user) req.user = user;
    } catch { /* ignore */ }
  }
  next();
}

export function verify(token) {
  return jwt.verify(token, config.jwtSecret);
}
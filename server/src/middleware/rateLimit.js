const buckets = new Map();

// Minimal fixed-window limiter to slow down credential-stuffing / brute force
// on auth endpoints without pulling in an extra dependency.
export function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.start > windowMs) {
      buckets.set(key, { start: now, count: 1 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests, please try again shortly' });
    }
    next();
  };
}

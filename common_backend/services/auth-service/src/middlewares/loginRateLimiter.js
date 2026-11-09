// Shared login rate limiter for Admin, Partner and Client modules.
// Counts only invalid-credential responses (HTTP 401).
const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

// Remove expired entries periodically so the in-memory store stays bounded.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of attempts.entries()) {
    if (now >= record.resetAt) attempts.delete(ip);
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();

const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let record = attempts.get(ip);

  if (record && now >= record.resetAt) {
    attempts.delete(ip);
    record = undefined;
  }

  if (record && record.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.setHeader("RateLimit-Limit", String(MAX_FAILED_ATTEMPTS));
    res.setHeader("RateLimit-Remaining", "0");

    return res.status(429).json({
      success: false,
      message: "Too many failed login attempts. Please try again after 15 minutes.",
      retryAfter,
    });
  }

  res.setHeader("RateLimit-Limit", String(MAX_FAILED_ATTEMPTS));
  res.setHeader(
    "RateLimit-Remaining",
    String(Math.max(0, MAX_FAILED_ATTEMPTS - (record?.count || 0)))
  );

  // Count invalid credentials only; clear the IP's failed attempts on success.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 401) {
      const currentTime = Date.now();
      let current = attempts.get(ip);

      if (!current || currentTime >= current.resetAt) {
        current = { count: 0, resetAt: currentTime + WINDOW_MS };
      }

      current.count += 1;
      attempts.set(ip, current);
      res.setHeader(
        "RateLimit-Remaining",
        String(Math.max(0, MAX_FAILED_ATTEMPTS - current.count))
      );
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      attempts.delete(ip);
    }

    return originalJson(body);
  };

  return next();
};

module.exports = loginRateLimiter;

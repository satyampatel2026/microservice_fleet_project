const rateLimit = require("express-rate-limit");

const createLoginRateLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many login attempts. Try again after 15 minutes."
    }
  });
};

module.exports = createLoginRateLimiter;
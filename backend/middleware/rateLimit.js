// backend/middleware/rateLimit.js
const { rateLimit } = require("express-rate-limit");
const { client } = require("../utils/redis");

// General protection for the whole API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Stricter limit for login / register / password reset (slows down guessing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again in a few minutes." },
});

const num = (value, fallback) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback);

// Counts requests in Redis so the limit is shared by every serverless instance.
// Returns the new count, or null if Redis is unavailable.
const hit = async (key, windowSec) => {
  try {
    if (!client.isOpen) return null;
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSec);
    return count;
  } catch (error) {
    console.error("Rate limit store error:", error.message);
    return null;
  }
};

// AI endpoints call a free-tier API, so they get three limits:
// per visitor per minute, per visitor per day, and one daily budget for the whole app.
const aiGuard = (name) => async (req, res, next) => {
  const perMinute = num(process.env.AI_LIMIT_PER_MINUTE, 10);
  const perDay = num(process.env.AI_LIMIT_PER_DAY, 80);
  const globalPerDay = num(process.env.AI_GLOBAL_LIMIT_PER_DAY, 800);

  const ip = req.ip || "unknown";
  const day = Math.floor(Date.now() / 86400000);
  const minute = Math.floor(Date.now() / 60000);

  const [m, d, g] = await Promise.all([
    hit(`ai:${name}:min:${ip}:${minute}`, 60),
    hit(`ai:${name}:day:${ip}:${day}`, 86400),
    hit(`ai:global:day:${day}`, 86400),
  ]);

  if (g !== null && g > globalPerDay) {
    return res.status(429).json({
      error: "The AI demo has reached its daily limit. Please try again tomorrow.",
    });
  }
  if ((m !== null && m > perMinute) || (d !== null && d > perDay)) {
    return res.status(429).json({
      error: "You are sending requests too quickly. Please wait a moment and try again.",
    });
  }
  next();
};

module.exports = { apiLimiter, authLimiter, aiGuard };

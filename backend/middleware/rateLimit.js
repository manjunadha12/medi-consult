import rateLimit from 'express-rate-limit';

// Standard rate limiter: Max 1000 requests per 15 minutes per IP
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    message: 'Too many requests from this node. Neural handshake throttled. Try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for Auth/Login: Relaxed for Dev
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 attempts
  message: {
    message: 'Multiple failed access attempts detected. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for OTP request endpoints.
 * Prevents brute-force OTP generation: max 5 requests per IP per 15 minutes.
 */
export const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many OTP requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for OTP verification endpoints.
 * Prevents brute-force OTP guessing: max 10 attempts per IP per 15 minutes.
 * OTP is 6 digits — without this, an attacker gets ~30,000 guesses in a 5-min OTP window.
 */
export const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many verification attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for login endpoint.
 * Prevents credential stuffing: max 20 login attempts per IP per 15 minutes.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset flow.
 * Max 5 reset requests per IP per hour.
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many password reset requests. Please try again after 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

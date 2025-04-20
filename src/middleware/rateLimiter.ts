import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100,
   message: {
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.'
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Auth endpoints rate limiter
export const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 20,
   message: {
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.'
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Health check rate limiter
export const healthLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 200,
   message: {
      error: 'Too Many Requests',
      message: 'Too many health check requests. Please try again later.'
   },
   standardHeaders: true,
   legacyHeaders: false,
}); 
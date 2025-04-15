import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';
import { getRequestId } from '@/utils/api-utils';

export const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // Limit each IP to 100 requests per window
   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
   handler: (req: Request, res: Response, _next: NextFunction) => {
      const requestId = getRequestId(req);
      logger.warn('Rate limit exceeded', {
         requestId,
         path: req.path,
         method: req.method,
         ip: req.ip,
      });

      res.status(429).json({
         success: false,
         message: 'Too many requests, please try again later.',
         details: {
            requestId,
            retryAfter: Math.ceil(15 * 60), // in seconds
         },
      });
   },
});

export const aiLimiter = rateLimit({
   windowMs: 60 * 60 * 1000, // 1 hour
   max: 20, // Limit each IP to 20 AI requests per hour
   standardHeaders: true,
   legacyHeaders: false,
   handler: (req: Request, res: Response, _next: NextFunction) => {
      const requestId = getRequestId(req);
      logger.warn('AI rate limit exceeded', {
         requestId,
         path: req.path,
         method: req.method,
         ip: req.ip,
      });

      res.status(429).json({
         success: false,
         message: 'Too many AI requests, please try again later.',
         details: {
            requestId,
            retryAfter: Math.ceil(60 * 60), // in seconds
         },
      });
   },
});

export const applyRateLimiting = (req: Request, res: Response, next: NextFunction) => {
   if (req.path.includes('/api/debate') && req.method === 'POST') {
      return aiLimiter(req, res, next);
   }
   return apiLimiter(req, res, next);
}; 
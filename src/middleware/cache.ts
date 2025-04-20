import { Request, Response, NextFunction } from 'express';
import redisClient, { CACHE_TTL } from '@/config/redis';

interface CacheOptions {
   ttl?: number;
   key?: string | ((req: Request) => string);
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
   return async (req: Request, res: Response, next: NextFunction) => {
      try {
         // Skip caching for non-GET requests
         if (req.method !== 'GET') {
            return next();
         }

         // Generate cache key
         const cacheKey = typeof options.key === 'function'
            ? options.key(req)
            : options.key || req.originalUrl;

         // Try to get cached response
         const cachedResponse = await redisClient.get(cacheKey);

         if (cachedResponse) {
            const data = JSON.parse(cachedResponse);
            return res.json(data);
         }

         // If no cache found, cache the response
         const originalJson = res.json.bind(res);
         res.json = ((data: any) => {
            // Store the response in cache
            redisClient.setex(
               cacheKey,
               options.ttl || CACHE_TTL.DEBATE_SESSION,
               JSON.stringify(data)
            );
            return originalJson(data);
         }) as Response['json'];

         next();
      } catch (error) {
         // If caching fails, continue without cache
         console.error('Cache middleware error:', error);
         next();
      }
   };
};

export const clearCache = async (pattern: string): Promise<void> => {
   try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
         await redisClient.del(...keys);
      }
   } catch (error) {
      console.error('Error clearing cache:', error);
   }
}; 
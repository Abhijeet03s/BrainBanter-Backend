import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis({
   host: process.env.REDIS_HOST || 'localhost',
   port: parseInt(process.env.REDIS_PORT || '6379'),
   password: process.env.REDIS_PASSWORD,
   retryStrategy: (times: number): number => {
      const delay = Math.min(times * 50, 2000);
      return delay;
   }
});

redisClient.on('error', (err: Error) => {
   console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
   console.log('Connected to Redis');
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
   DEBATE_SESSION: 3600, // 1 hour
   USER_PROFILE: 1800,   // 30 minutes
   SAVED_DEBATES: 3600,  // 1 hour
   MESSAGES: 1800       // 30 minutes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
   DEBATE_SESSION: 'debate:session:',
   USER_PROFILE: 'user:profile:',
   SAVED_DEBATES: 'user:saved_debates:',
   MESSAGES: 'debate:messages:'
} as const;

export default redisClient; 
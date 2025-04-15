import NodeCache from 'node-cache';
import { logger } from '@/utils/logger';

class CacheService {
   private cache: NodeCache;

   constructor() {
      // Standard TTL of 1 hour, check expiry every 10 minutes
      this.cache = new NodeCache({
         stdTTL: 3600,
         checkperiod: 600,
         useClones: false
      });

      logger.info('Cache service initialized');
   }

   /**
    * Set a value in the cache
    * @param key - The cache key
    * @param value - The value to cache
    * @param ttl - Time to live in seconds (optional, defaults to stdTTL)
    */
   set(key: string, value: any, ttl?: number): boolean {
      try {
         // If ttl is undefined, don't provide it as a parameter to use stdTTL
         const result = ttl !== undefined
            ? this.cache.set(key, value, ttl)
            : this.cache.set(key, value);

         logger.debug('Cache item set', { key, ttl: ttl || 'default' });
         return result;
      } catch (error) {
         logger.error('Error setting cache item', { key, error });
         return false;
      }
   }

   /**
    * Get a value from the cache
    * @param key - The cache key
    * @returns The cached value or undefined if not found
    */
   get<T>(key: string): T | undefined {
      try {
         const value = this.cache.get<T>(key);
         logger.debug('Cache access', { key, hit: value !== undefined });
         return value;
      } catch (error) {
         logger.error('Error getting cache item', { key, error });
         return undefined;
      }
   }

   /**
    * Delete a value from the cache
    * @param key - The cache key
    * @returns True if the item was deleted, false otherwise
    */
   delete(key: string): boolean {
      try {
         const deleted = this.cache.del(key);
         logger.debug('Cache item deleted', { key, success: deleted > 0 });
         return deleted > 0;
      } catch (error) {
         logger.error('Error deleting cache item', { key, error });
         return false;
      }
   }

   /**
    * Clear the entire cache
    */
   clear(): void {
      try {
         this.cache.flushAll();
         logger.info('Cache cleared');
      } catch (error) {
         logger.error('Error clearing cache', { error });
      }
   }

   /**
    * Get cache statistics
    */
   getStats() {
      return this.cache.getStats();
   }

   /**
    * Create a cache key from multiple parts
    */
   createKey(...parts: any[]): string {
      return parts.map(part =>
         typeof part === 'object'
            ? JSON.stringify(part)
            : String(part)
      ).join(':');
   }
}

// Export singleton instance
export const cacheService = new CacheService(); 
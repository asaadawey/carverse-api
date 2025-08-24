import { RequestHandler } from 'express';

// Simple cache storage
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > item.ttl * 1000) {
      cache.delete(key);
    }
  }
}, 60000);

// Simple cache middleware factory
export const cacheMiddleware = (
  keyGenerator: (req: any) => string,
  ttlSeconds: number = 300,
  condition?: (req: any) => boolean,
): RequestHandler => {
  return (req, res, next) => {
    // Skip caching if condition is not met or not GET request
    if ((condition && !condition(req)) || req.method !== 'GET' || req.headers['x-no-cache']) {
      res.set('X-Cache', req.headers['x-no-cache'] ? 'SKIP' : '');
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedItem = cache.get(cacheKey);

    // Check if cached data exists and is not expired
    if (cachedItem && Date.now() - cachedItem.timestamp < cachedItem.ttl * 1000) {
      stats.hits++;

      // Add cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', cacheKey);

      if (req.logger) {
        req.logger.info(`[RESPONSE] ${req.method} Cache hit`, {
          cacheKey,
          endpoint: req.route?.path,
          data: cachedItem.data,
        });
      }

      return res.json(cachedItem.data);
    }

    // Cache miss - intercept response
    stats.misses++;
    const originalJson = res.json;

    res.json = function (data: any) {
      // Cache successful responses only
      if (res.statusCode === 200 && data) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: ttlSeconds,
        });
        stats.sets++;

        if (req.logger) {
          req.logger.info('Cache set', { cacheKey, endpoint: req.route?.path, ttl: ttlSeconds });
        }
      }

      // Add cache headers
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      return originalJson.call(this, data);
    };

    next();
  };
};

// NOTE: cache key generators were intentionally removed from this module.
// Define each cache key directly on the route when calling `cacheMiddleware`.
// Example:
//   router.get('/orders/:id',
//     cacheMiddleware((req) => `order:${req.params.id}`, cacheTTL.medium),
//     getOneOrderController
//   );

// Cache TTL presets (in seconds)
export const cacheTTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 900, // 15 minutes
  veryLong: 1800, // 30 minutes
};

// Cache invalidation helpers
// Usage examples:
// 1) Remove a single, exact key (e.g. after updating one order)
//    invalidateCache(`order:${orderId}`);
// 2) Remove keys by substring
//    invalidateCache('orders:list'); // deletes any cache key containing 'orders:list'
// 3) Use wildcard-style patterns with clearCachePattern (accepts '*' as wildcard)
//    clearCachePattern('provider:123:orders:*');
//    // deletes keys like 'provider:123:orders:page1', 'provider:123:orders:all'
// 4) Clear cache by provider ID (for complex JSON keys)
//    clearCacheByProviderId(123); // clears cache entries where user.providerId === 123
// 5) Clear all cache
//    clearCache();
// 6) Example inside an Express controller after DB update:
//    const updateOrder: RequestHandler = async (req, res, next) => {
//      await req.prisma.orders.update({ where: { id: Number(req.params.id) }, data: { /* ... */ } });
//      // invalidate any cache entries related to this order
//      clearCachePattern(`order:${req.params.id}*`);
//      return next();
//    };

export const invalidateCache = (pattern: string) => {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      stats.deletes++;
    }
  }
};

export const clearCachePattern = (pattern: string) => {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      stats.deletes++;
    }
  }
};

export const clearCacheByProviderId = (providerId: number, type: 'services' | 'revenue') => {
  let deletedCount = 0;
  for (const key of cache.keys()) {
    try {
      // Parse the cache key to check if it contains the specific providerId
      if (key.startsWith('providerServices:') && type === 'services') {
        // Extract the JSON part after 'providerServices:'
        const jsonPart = key.substring('providerServices:'.length);
        const keyData = JSON.parse(jsonPart);

        // Check if this cache entry is for the specific provider
        if (keyData.user && keyData.user.providerId === providerId) {
          cache.delete(key);
          stats.deletes++;
          deletedCount++;
        }
      }
      if (key.startsWith('provider_revenue:') && type === 'revenue') {
        // Extract the JSON part after 'provider_revenue:'
        const jsonPart = key.substring('provider_revenue:'.length);
        const keyData = JSON.parse(jsonPart);

        // Check if this cache entry is for the specific provider
        if (keyData.user && keyData.user.providerId === providerId) {
          cache.delete(key);
          stats.deletes++;
          deletedCount++;
        }
      }
    } catch (error) {
      // If JSON parsing fails, skip this key
      continue;
    }
  }
  return deletedCount;
};

export const clearCache = () => {
  cache.clear();
};

// Cache statistics
export const getCacheStats = () => ({
  ...stats,
  keys: cache.size,
  hitRate: stats.hits / (stats.hits + stats.misses) || 0,
});

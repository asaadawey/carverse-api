/**
 * Cache Middleware Usage Examples
 *
 * This file demonstrates how to use the simplified cache middleware
 * with different configurations and patterns.
 */

import { cacheMiddleware, cacheTTL, clearCache, clearCachePattern } from '../middleware/cache.middleware';

// Example 1: Basic cache usage with predefined TTL
const basicCacheExample = cacheMiddleware((req) => `order:${req.params.id}`, cacheTTL.short);

// Example 2: Custom cache key with medium TTL
const customCacheExample = cacheMiddleware(
  (req) => `user-profile:${req.params.id || req.user?.id || 'default'}`,
  cacheTTL.medium,
);

// Example 3: Dynamic cache key generator
const dynamicCacheExample = cacheMiddleware(
  (req) => `provider-services-${req.params.providerId}-${req.query.active}`,
  cacheTTL.long, // 15 minutes
);

// Example 4: API-specific cache with custom TTL
const apiSpecificCacheExample = cacheMiddleware((req) => `api:/api/v1/dashboard`, 60 * 10); // 10 minutes

// Example usage in routes:
/*
import express from 'express';
import { cacheMiddleware, cacheTTL } from '../middleware/cache.middleware';

const router = express.Router();

// Cache user orders for 2 minutes
router.get('/orders', 
  cacheMiddleware((req) => `user_orders:${req.user?.id}:${JSON.stringify(req.query)}`, cacheTTL.short), 
  getAllOrdersController
);

// Cache single order for 5 minutes
router.get('/orders/:id', 
  cacheMiddleware((req) => `order:${req.params.id}`, cacheTTL.medium), 
  getOneOrderController
);

// Cache provider services with dynamic key
router.get('/providers/:providerId/services', 
  cacheMiddleware(
    (req) => `provider-${req.params.providerId}-services`,
    cacheTTL.medium
  ), 
  getProviderServicesController
);
*/

// Cache invalidation examples:
export const cacheInvalidationExamples = {
  // Clear specific order cache
  clearOrderCache: (orderId: string) => clearCache(),

  // Clear all user-related caches
  clearUserCaches: (userId: string) => clearCachePattern(`*user*${userId}*`),

  // Clear all order caches
  clearAllOrderCaches: () => clearCachePattern('*order*'),

  // Clear API endpoint cache
  clearAPICache: (endpoint: string) => clearCachePattern(`*api*${endpoint}*`),
};

export { basicCacheExample, customCacheExample, dynamicCacheExample, apiSpecificCacheExample };

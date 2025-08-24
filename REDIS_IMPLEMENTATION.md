# Redis Implementation for Socket.IO Data Persistence

## Overview

This implementation migrates the `onlineProviders` and `activeOrders` arrays from in-memory storage to Redis-backed persistence while maintaining backward compatibility and ensuring unit tests continue to work.

## Key Components

### 1. SocketRedisManager (`src/utils/socketRedisManager.ts`)

A comprehensive Redis manager that provides:

- **Hybrid Storage**: Maintains in-memory arrays for immediate access while persisting to Redis in the background
- **Synchronous API**: All functions remain synchronous to avoid breaking existing code
- **Test Compatibility**: Uses in-memory fallback when `isTest` is true
- **Background Persistence**: Redis operations are fire-and-forget to avoid blocking the main thread
- **Initialization**: Loads existing data from Redis on startup

#### Features:

- Provider management: `addProvider`, `updateProvider`, `removeProvider`, `getProvider`
- Order management: `addOrder`, `updateOrder`, `removeOrder`, `getOrder`
- Bulk operations: `getAllProviders`, `getAllOrders`, `setAllProviders`, `setAllOrders`
- Utilities: `clearAll`, `syncToRedis`, `getInMemoryData`

### 2. Updated Socket.IO Functions (`src/web-socket/index.ts`)

All provider and order management functions now use the Redis manager:

```typescript
// Before (in-memory only)
onlineProviders = [...onlineProviders.filter((p) => p.userId !== provider.userId), provider];

// After (Redis-backed with in-memory performance)
const updatedProviders = SocketRedisManager.addProvider(provider);
onlineProviders = updatedProviders; // Keep legacy array in sync
```

#### Key Changes:

- All CRUD operations now use `SocketRedisManager`
- Legacy arrays (`onlineProviders`, `activeOrders`) are kept in sync for backward compatibility
- Redis initialization on server startup
- Async `resetVars()` function for tests

### 3. Updated Unit Tests (`src/web-socket/index.spec.ts`)

Complete mock implementation for testing:

```typescript
jest.mock('@src/utils/socketRedisManager', () => {
  // In-memory storage for testing
  let testProviders: any[] = [];
  let testOrders: any[] = [];

  return {
    SocketRedisManager: {
      // All methods mocked with in-memory implementations
    },
  };
});
```

#### Test Improvements:

- Redis manager is fully mocked for tests
- Tests run in isolated in-memory mode
- All existing test cases maintained
- Added `PaymentMethods` imports and usage
- Async `resetVars()` support

## Benefits

### 1. **Data Persistence**

- Server restarts no longer lose online providers and active orders
- Data survives application crashes and deployments
- Enables horizontal scaling with shared state

### 2. **Performance**

- In-memory access for read operations (no Redis latency)
- Background Redis persistence doesn't block operations
- Maintains original synchronous API

### 3. **Backward Compatibility**

- All existing code continues to work unchanged
- Legacy arrays still available for debugging
- Original function signatures preserved

### 4. **Test Reliability**

- Tests run completely in-memory (no Redis dependency)
- Mocked implementation matches real behavior
- Fast test execution

### 5. **Production Ready**

- Graceful fallback when Redis is unavailable
- Comprehensive error handling
- TTL support (1 hour) for auto-cleanup

## Configuration

### Environment Variables

```bash
# Redis connection (existing)
REDIS_URL=redis://localhost:6379
# OR individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

### Redis Keys Used

- `socket:onlineProviders` - Stores provider data
- `socket:activeOrders` - Stores order data

## Usage Examples

### Adding a Provider

```typescript
// Automatically persists to Redis and updates in-memory array
const updatedProviders = SocketRedisManager.addProvider(newProvider);
```

### Getting Orders

```typescript
// Fast in-memory retrieval
const order = SocketRedisManager.getOrder('orderId', 123);
```

### Manual Sync (for debugging)

```typescript
// Force sync legacy arrays with Redis data
const status = syncLegacyArrays();
console.log(`Providers: ${status.onlineProviders}, Orders: ${status.activeOrders}`);
```

## Testing

### Run Socket Tests

```bash
npm test -- src/web-socket/index.spec.ts
```

### Test Coverage

- All existing test cases pass
- Redis operations are mocked
- No external dependencies during testing

## Migration Notes

1. **No Breaking Changes**: All existing code continues to work
2. **Gradual Rollout**: Can be deployed without downtime
3. **Monitoring**: Use `syncLegacyArrays()` to verify data consistency
4. **Rollback**: Can disable Redis by setting `isTest=true` in production temporarily

## Future Enhancements

1. **Redis Clustering**: Support for Redis cluster mode
2. **Data Compression**: Compress large objects before storing
3. **Expiration Policies**: Custom TTL per data type
4. **Real-time Sync**: WebSocket notifications for multi-instance sync
5. **Metrics**: Track Redis performance and hit rates

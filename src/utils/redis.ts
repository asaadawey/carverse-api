import { createClient, RedisClientType } from 'redis';
import { Redis } from 'ioredis';
import envVars, { isTest } from '@src/config/environment';
import logger from '@src/utils/logger';
import { RedisClient } from 'ioredis/built/connectors/SentinelConnector/types';

// Redis client instances
let redisClient: ReturnType<typeof createClient> | null = null;
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

/**
 * Get or create Redis client for rate limiting (node-redis)
 */
export const getRedisClient = async (): Promise<ReturnType<typeof createClient> | null> => {
  if (redisClient || isTest) {
    return redisClient;
  }

  try {
    const connectionConfig = envVars.redis.url
      ? { url: envVars.redis.url }
      : {
          url: `redis://${envVars.redis.username}:${envVars.redis.password}@${envVars.redis.host}:${envVars.redis.port}`,
        };

    redisClient = createClient(connectionConfig);

    redisClient.on('error', (error: any) => {
      logger.error('Redis client error:', {
        error: error.message,
        code: error.code,
      });
      console.error('[REDIS] Client error:', error.message);
    });

    redisClient.on('connect', () => {
      console.log('[REDIS] Client connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('[REDIS] Client reconnecting...');
    });

    await redisClient.connect();

    logger.info('Redis client initialized successfully');
    return redisClient;
  } catch (error: any) {
    logger.error('Failed to initialize Redis client:', {
      error: error.message,
      code: error.code,
    });
    console.error('Redis connection error:', error?.message || 'Unknown error');
    redisClient = null;
    return null;
  }
};

/**
 * Get or create Redis clients for Socket.IO (ioredis)
 */
export const getSocketRedisClients = () => {
  if ((pubClient && subClient) || isTest) {
    return { pubClient, subClient };
  }

  try {
    const baseConfig = {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };

    // Create pub client based on URL or individual config
    if (envVars.redis.url) {
      pubClient = new Redis(envVars.redis.url, baseConfig);
    } else {
      pubClient = new Redis({
        ...baseConfig,
        port: envVars.redis.port,
        host: envVars.redis.host,
        username: envVars.redis.username,
        password: envVars.redis.password,
      });
    }

    subClient = pubClient.duplicate();

    // Add error handlers for Redis connections
    pubClient.on('error', (error: any) => {
      logger.error('Redis pub client error:', {
        error: error.message,
        code: error.code,
      });
      if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
        console.error('[REDIS] Pub client error:', error.message);
      }
    });

    subClient.on('error', (error: any) => {
      logger.error('Redis sub client error:', {
        error: error.message,
        code: error.code,
      });
      if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE') {
        console.error('[REDIS] Sub client error:', error.message);
      }
    });

    pubClient.on('connect', () => {
      console.log('[REDIS] Pub client connected');
    });

    subClient.on('connect', () => {
      console.log('[REDIS] Sub client connected');
    });

    pubClient.on('reconnecting', () => {
      console.log('[REDIS] Pub client reconnecting...');
    });

    subClient.on('reconnecting', () => {
      console.log('[REDIS] Sub client reconnecting...');
    });

    console.log('Redis Socket.IO clients created successfully');
    return { pubClient, subClient };
  } catch (error: any) {
    console.error('Redis Socket.IO connection error:', error?.message || 'Unknown error');
    // Continue without Redis adapter in case of connection issues
    pubClient = null;
    subClient = null;
    return { pubClient: null, subClient: null };
  }
};

/**
 * Cleanup Redis connections
 */
export const closeRedisConnections = async () => {
  const promises: Promise<any>[] = [];

  if (redisClient) {
    promises.push(redisClient.quit().catch(console.error));
    redisClient = null;
  }

  if (pubClient) {
    promises.push(pubClient.quit().catch(console.error));
    pubClient = null;
  }

  if (subClient) {
    promises.push(subClient.quit().catch(console.error));
    subClient = null;
  }

  await Promise.all(promises);
  console.log('[REDIS] All connections closed');
};

/**
 * Health check for Redis connections
 */
export const checkRedisHealth = async () => {
  const status = {
    redisClient: false,
    pubClient: false,
    subClient: false,
  };

  try {
    if (redisClient) {
      await redisClient.ping();
      status.redisClient = true;
    }
  } catch (error) {
    console.error('[REDIS] Health check failed for redis client:', error);
  }

  try {
    if (pubClient) {
      await pubClient.ping();
      status.pubClient = true;
    }
  } catch (error) {
    console.error('[REDIS] Health check failed for pub client:', error);
  }

  try {
    if (subClient) {
      await subClient.ping();
      status.subClient = true;
    }
  } catch (error) {
    console.error('[REDIS] Health check failed for sub client:', error);
  }

  return status;
};

// Export client instances for direct access if needed
export { redisClient, pubClient, subClient };

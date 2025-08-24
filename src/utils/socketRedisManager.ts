import { getRedisClient } from './redis';
import { ProviderSocket, ActiveOrders } from '@src/web-socket/index';
import { isTest } from '@src/config/environment';
import { createClient } from 'redis';

// Redis keys
const ONLINE_PROVIDERS_KEY = 'socket:onlineProviders';
const ACTIVE_ORDERS_KEY = 'socket:activeOrders';

// In-memory storage ONLY for tests
let testProviders: ProviderSocket[] = [];
let testOrders: ActiveOrders[] = [];

// Cache Redis client reference
let redisClientCache: ReturnType<typeof createClient> | null = null;

/**
 * Get Redis client with caching
 */
async function getClient(): Promise<ReturnType<typeof createClient> | null> {
  if (isTest) return null;

  if (!redisClientCache) {
    redisClientCache = await getRedisClient();
  }
  return redisClientCache;
}

/**
 * Initialize socket data from Redis on startup
 * Only loads data in non-test environments
 */
export async function initializeSocketData(): Promise<{ providers: number; orders: number }> {
  if (isTest) {
    console.log('[SOCKET-REDIS] Test environment - using in-memory storage');
    return { providers: 0, orders: 0 };
  }

  try {
    const client = await getClient();
    if (!client) {
      console.log('[SOCKET-REDIS] Redis client not available');
      return { providers: 0, orders: 0 };
    }

    // Load providers
    const providersData = await client.get(ONLINE_PROVIDERS_KEY);
    const providersCount = providersData ? JSON.parse(providersData).length : 0;

    // Load orders
    const ordersData = await client.get(ACTIVE_ORDERS_KEY);
    const ordersCount = ordersData ? JSON.parse(ordersData).length : 0;

    console.log(`[SOCKET-REDIS] Loaded ${providersCount} providers and ${ordersCount} orders from Redis`);
    return { providers: providersCount, orders: ordersCount };
  } catch (error) {
    console.error('[SOCKET-REDIS] Error initializing from Redis:', error);
    return { providers: 0, orders: 0 };
  }
}

// ==================== PROVIDER FUNCTIONS ====================

/**
 * Get all providers from Redis or test memory
 */
export async function getAllProviders(): Promise<ProviderSocket[]> {
  if (isTest) {
    return [...testProviders];
  }

  try {
    const client = await getClient();
    if (!client) return [];

    const data = await client.get(ONLINE_PROVIDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[SOCKET-REDIS] Error getting providers:', error);
    return [];
  }
}

/**
 * Set all providers in Redis or test memory
 */
export async function setAllProviders(providers: ProviderSocket[]): Promise<void> {
  if (isTest) {
    testProviders = [...providers];
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    await client.set(ONLINE_PROVIDERS_KEY, JSON.stringify(providers));
  } catch (error) {
    console.error('[SOCKET-REDIS] Error setting providers:', error);
  }
}

/**
 * Add a provider
 */
export async function addProvider(provider: ProviderSocket): Promise<ProviderSocket[]> {
  const providers = await getAllProviders();
  const updatedProviders = [...providers.filter((p) => p.userId !== provider.userId), provider];
  await setAllProviders(updatedProviders);
  return updatedProviders;
}

/**
 * Update a provider
 */
export async function updateProvider(
  searchKey: keyof ProviderSocket,
  searchValue: any,
  newValues: Partial<ProviderSocket>,
): Promise<ProviderSocket | undefined> {
  const providers = await getAllProviders();
  const provider = providers.find((p) => p[searchKey] === searchValue);

  if (provider) {
    const updatedProvider = { ...provider, ...newValues };
    const updatedProviders = [...providers.filter((p) => p[searchKey] !== searchValue), updatedProvider];
    await setAllProviders(updatedProviders);
    return updatedProvider;
  }

  return undefined;
}

/**
 * Remove a provider
 */
export async function removeProvider(
  searchKey: keyof ProviderSocket,
  searchValue: any,
): Promise<ProviderSocket | undefined> {
  const providers = await getAllProviders();
  const provider = providers.find((p) => p[searchKey] === searchValue);

  if (provider) {
    const updatedProviders = providers.filter((p) => p[searchKey] !== searchValue);
    await setAllProviders(updatedProviders);
  }

  return provider;
}

/**
 * Get a single provider
 */
export async function getProvider(
  searchKey: keyof ProviderSocket,
  searchValue: any,
): Promise<ProviderSocket | undefined> {
  const providers = await getAllProviders();
  return providers.find((p) => p[searchKey] === searchValue);
}

// ==================== ORDER FUNCTIONS ====================

/**
 * Get all orders from Redis or test memory
 */
export async function getAllOrders(): Promise<ActiveOrders[]> {
  if (isTest) {
    return [...testOrders];
  }

  try {
    const client = await getClient();
    if (!client) return [];

    const data = await client.get(ACTIVE_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[SOCKET-REDIS] Error getting orders:', error);
    return [];
  }
}

/**
 * Set all orders in Redis or test memory
 */
export async function setAllOrders(orders: ActiveOrders[]): Promise<void> {
  if (isTest) {
    testOrders = [...orders];
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    await client.set(ACTIVE_ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('[SOCKET-REDIS] Error setting orders:', error);
  }
}

/**
 * Add an order
 */
export async function addOrder(order: ActiveOrders): Promise<ActiveOrders[]> {
  const orders = await getAllOrders();
  const updatedOrders = [...orders.filter((o) => o.orderId !== order.orderId), order];
  await setAllOrders(updatedOrders);
  return updatedOrders;
}

/**
 * Update an order
 */
export async function updateOrder(
  searchKey: keyof ActiveOrders,
  searchValue: any,
  newValues: Partial<ActiveOrders>,
): Promise<ActiveOrders | undefined> {
  const orders = await getAllOrders();
  const order = orders.find((o) => o[searchKey] === searchValue);

  if (order) {
    const updatedOrder = { ...order, ...newValues };
    const updatedOrders = [...orders.filter((o) => o[searchKey] !== searchValue), updatedOrder];
    await setAllOrders(updatedOrders);
    return updatedOrder;
  }

  return undefined;
}

/**
 * Remove an order
 */
export async function removeOrder(searchKey: keyof ActiveOrders, searchValue: any): Promise<ActiveOrders | undefined> {
  const orders = await getAllOrders();
  const order = orders.find((o) => o[searchKey] === searchValue);

  if (order) {
    const updatedOrders = orders.filter((o) => o[searchKey] !== searchValue);
    await setAllOrders(updatedOrders);
  }

  return order;
}

/**
 * Get a single order
 */
export async function getOrder(searchKey: keyof ActiveOrders, searchValue: any): Promise<ActiveOrders | undefined> {
  const orders = await getAllOrders();
  console.log('Retrieved orders:', orders);
  console.log('Attempting to find order:', { searchKey, searchValue });
  return orders.find((o) => o[searchKey] === searchValue);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear all data from Redis or test memory
 */
export async function clearAll(): Promise<void> {
  if (isTest) {
    testProviders = [];
    testOrders = [];
    return;
  }

  try {
    const client = await getClient();
    if (!client) return;

    await Promise.all([client.del(ONLINE_PROVIDERS_KEY), client.del(ACTIVE_ORDERS_KEY)]);
  } catch (error) {
    console.error('[SOCKET-REDIS] Error clearing Redis data:', error);
  }
}

/**
 * Get current test data (for testing only)
 */
export function getTestData() {
  if (!isTest) {
    throw new Error('getTestData() can only be called in test environment');
  }
  return {
    providers: [...testProviders],
    orders: [...testOrders],
  };
}

import { Server, Socket } from 'socket.io';
import _ from 'lodash';
import prismaClient from '@src/helpers/databaseHelpers/client';
import { Constants, OrderHistory, PaymentMethods, UserTypes } from '../interfaces/enums';
import schedule from 'node-schedule';
import { addSeconds } from 'date-fns';
import envVars, { isTest } from '@src/config/environment';
import apiAuthMiddleware from '@src/middleware/apiAuth.middleware';
import sendNotification from '@src/utils/sendNotification';
import { cancelOnHoldPayment, capturePayment } from '@src/utils/payment';
import corsOptions from '@src/utils/cors';
import logger from '@src/utils/logger';

// Environment-based logging helper for socket events
const socketLogger = {
  debug: (message: string, data?: any) => {
    if (envVars.mode !== 'production') {
      logger.debug(`[SOCKET] ${message}`, data);
    }
  },
  info: (message: string, data?: any) => {
    logger.info(`[SOCKET] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    logger.warn(`[SOCKET] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    logger.error(`[SOCKET] ${message}`, { error: error?.message || error, stack: error?.stack });
  },
};
import {
  initializeChat,
  authenticateUser,
  joinOrderChat,
  sendMessage,
  getChatHistory,
  handleUserDisconnect,
  updateUserOnlineStatus,
  startTyping,
  stopTyping,
  sendSystemMessage,
  getOnlineUsers,
  getTypingUsers,
} from './chatSocket';
import {
  ChatSocket,
  ChatAuthenticationPayload,
  ChatAuthenticationResponse,
  JoinOrderChatPayload,
  JoinOrderChatResponse,
  LeaveOrderChatPayload,
  SendMessagePayload,
  SendMessageResponse,
  TypingIndicatorPayload,
  GetChatHistoryPayload,
  ChatHistoryResponse,
  ChatErrorPayload,
  UserJoinedChatPayload,
  UserLeftChatPayload,
  NewMessageNotification,
  UserTypingNotification,
  OnlineUsersUpdate,
} from '../types/chat.types';
import { getTimeoutObject, Timeout } from '@src/utils/orderUtils';
import { getSocketRedisClients } from '@src/utils/redis';
import * as SocketRedisManager from '@src/utils/socketRedisManager';
// import { SocketRateLimiter, DuplicateConnectionPreventer } from '@src/utils/socketRateLimit';

// Import Redis adapter
import { createAdapter } from '@socket.io/redis-adapter';
import { clearCacheByProviderId } from '@src/middleware/cache.middleware';

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception in Socket.IO server:', {
    error: error.message,
    stack: error.stack,
    code: (error as any).code,
    errno: (error as any).errno,
    syscall: (error as any).syscall,
  });

  // Don't exit for connection reset errors as they're recoverable
  if ((error as any).code === 'ECONNRESET' || (error as any).code === 'EPIPE') {
    socketLogger.info('Connection reset error handled, continuing...');
    return;
  }

  // For other uncaught exceptions, log but don't crash
  socketLogger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection in Socket.IO server:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  socketLogger.error('Unhandled promise rejection:', reason);
});

//#region Enums & Interfaces
export enum ProviderStatus {
  Online = 'Online',
  Offline = 'Offline',
  HaveOrder = 'Have order',
}

enum OrderStep {
  stillNotAcceptedByProvider0,
  inProgressNotArrived1,
  inProgressArrived2,
  providerFinishedAndTakePictures3,
  awaitingCustomerAcceptance4,
  finished5,
}

type BroadcastHelperArgs = {
  requestor: UserTypes;
  receiver: UserTypes;
};

export type ProviderSocket = {
  userId: number;
  providerId: number;
  longitude: number;
  latitude: number;
  uuid: string;
  status: ProviderStatus;
  moduleId: number;
  notifcationToken: string;
};

export type OrderDetails = {
  orderId: number;
  orderStep: OrderStep;
};

export type ActiveOrders = OrderDetails & {
  arrivalThreshold: number;
  orderTimeoutSeconds: Timeout;
  providerUuid: string;
  customerUuid: string;
  customerUserId: number;
  providerUserId: number;
  customerNotificationToken: string;
  orderPaymentMethod: PaymentMethods;
  orderSubmissionType: 'auto-select' | 'provider-select';
};

export type Result = {
  result: boolean;
  message?: string;
};

export type OrderAccept = OrderDetails &
  Result & {
    orderId: number;
    providerId: number;
    userId: number;
  };

export type OrderReject = OrderDetails & Result;

type ActiveSession = {
  type: 'provider' | 'customer';
  order: ActiveOrders & { moduleId: number };
};

type UserInfo = { UserTypeName: string; id: number };

type CommonForAllService<T> = {
  socket: CustomSocket;
  searchKey?: keyof T;
  searchValue: any;
};

type GetService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: Omit<CommonForAllService<T>, 'socket'>,
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => Promise<T | undefined>;

type UpdateService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: CommonForAllService<T> & {
    newValues: Partial<T>;
  },
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => Promise<T | undefined>;

type AddService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: { socket: CustomSocket; newArgs: T },
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => Promise<boolean>;

type RemoveService<T, TSecondArg, THirdArg> = (
  args: CommonForAllService<T>,
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => Promise<T | undefined>;

/**
 * Socket.IO Server with full TypeScript support for chat and order events
 *
 * Features:
 * - Complete type safety for all socket events
 * - IntelliSense support for event names and payloads
 * - Compile-time validation of event data structures
 * - Separate interfaces for client-to-server and server-to-client events
 *
 * Chat Events:
 * Client → Server: chat-authenticate, chat-join-order, chat-leave-order, chat-send-message, chat-get-history, chat-typing
 * Server → Client: chat-authenticated, chat-authentication-failed, chat-joined-order, chat-error, chat-user-joined, chat-user-left, chat-history, chat-user-typing, chat-new-message, chat-message-sent, chat-online-users
 *
 * Order Events:
 * Client → Server: provider-online-start, new-order, provider-accept-order, etc.
 * Server → Client: provider-online-finish, order-accepted, order-rejected, etc.
 */
export interface ServerToClientEvents {
  'provider-online-finish': (data: Result) => void;
  'provider-offline-finish': (data: Result) => void;
  'online-users': (data: ProviderSocket[]) => void;
  'notify-order-add': (data: ActiveOrders) => void;
  'notify-order-remove': (data: ActiveOrders) => void;
  'notify-active-order-remove': (data: ActiveOrders) => void;
  'order-accepted': (data: OrderAccept) => void;
  'order-rejected': (data: OrderReject) => void;
  'set-active-order': (data: OrderDetails) => void;
  'order-timeout': (data: { message: string; orderDead?: true }) => void;
  'provider-to-customer-location-change': (data: {
    longitude: number;
    latitude: number;
    providerId: number;
    userId: number;
  }) => void;
  'provider-to-customer-arrived': (data: OrderDetails) => void;
  'customer-to-provider-finished-order': (data: OrderDetails & Result) => void;
  'provider-to-customer-finished-confirmation': (data: OrderDetails) => void;
  'auto-select-order-started': (data: { orderId: number; totalProviders: number; maxDistance: number }) => void;
  'auto-select-provider-notified': (data: {
    orderId: number;
    providerId: number;
    distance: number;
    currentIndex: number;
    totalProviders: number;
    timeout: Timeout;
  }) => void;
  'auto-select-provider-rejected': (data: { orderId: number; rejectedProviderId: number; message: string }) => void;
  'auto-select-order-completed': (data: { orderId: number; selectedProviderId?: number; success: boolean }) => void;
  'order-verify-result': (data: { result: boolean; orderId: number }) => void;
  disconnect: any;
  'notify-active-session': (args: ActiveSession) => void;

  // Chat events (server to client)
  'chat-authenticated': (data: ChatAuthenticationResponse) => void;
  'chat-authentication-failed': (data: { error: string }) => void;
  'chat-joined-order': (data: JoinOrderChatResponse) => void;
  'chat-error': (data: ChatErrorPayload) => void;
  'chat-user-joined': (data: UserJoinedChatPayload) => void;
  'chat-user-left': (data: UserLeftChatPayload) => void;
  'chat-history': (data: ChatHistoryResponse) => void;
  'chat-user-typing': (data: UserTypingNotification) => void;
  'chat-new-message': (data: NewMessageNotification) => void;
  'chat-message-sent': (data: SendMessageResponse) => void;
  'chat-online-users': (data: OnlineUsersUpdate) => void;
}

/**
 * Client-to-Server Events Interface
 * Defines all events that clients can send to the server with proper TypeScript typing
 */
export interface ClientToServerEvents {
  'provider-online-start': (data: ProviderSocket) => void;
  'provider-offline-start': (data: { id: number }) => void;
  'provider-arrived': (data: { orderId: number }) => void;
  'provider-online-location-change': (data: {
    userId: number;
    longitude: number;
    latitude: number;
    providerId: number;
  }) => void;
  'new-order': (data: {
    orderPaymentMethod: PaymentMethods;
    orderId: number;
    customerUuid: string;
    customrUserId: number;
    providerId: number;
    userId: number;
    customerNotificationToken: string;
  }) => void;
  'auto-select-order': (data: {
    orderId: number;
    orderPaymentMethod: PaymentMethods;
    customerUuid: string;
    customrUserId: number;
    customerLatitude: number;
    customerLongitude: number;
    customerNotificationToken: string;
    moduleId: number;
    maxDistance?: number;
  }) => void;
  'all-online-providers': (moduleId: number) => void;
  'provider-accept-order': (data: { orderId: number; customerUuid: string }) => void;
  'provider-reject-order': (data: { orderId: number; customerUuid: string }) => void;
  'customer-reject-inprogress-order': (data: { orderId: number; providerId: number }) => void;
  'provider-finished-order': (data: OrderDetails) => void;
  'customer-confirms-finished-order': (data: OrderDetails & Result) => void;
  'force-check-active-session': (data: {
    user: UserInfo;
    notificationToken: string;
    updatedLocation: {
      longitude: number;
      latitude: number;
    };
  }) => void;
  'verify-order': (data: { orderId: number; userId: number; userType: string }) => void;
  disconnect: any;
  connect: any;

  // Chat events (client to server)
  'chat-authenticate': (data: ChatAuthenticationPayload) => void;
  'chat-join-order': (data: JoinOrderChatPayload) => void;
  'chat-leave-order': (data: LeaveOrderChatPayload) => void;
  'chat-send-message': (data: SendMessagePayload) => void;
  'chat-get-history': (data: GetChatHistoryPayload) => void;
  'chat-typing': (data: TypingIndicatorPayload) => void;
}
//#endregion

export let ORDER_TIMEOUT_SECONDS = Number(envVars.order.timeout);
// export let ORDER_TIMEOUT_SECONDS = 60;

socketLogger.debug(`ORDER_TIMEOUT_SECONDS: ${ORDER_TIMEOUT_SECONDS}`);
// const ORDER_TIMEOUT_SECONDS = Number(300);
type SocketData = {
  userInfo: UserInfo;
};

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Get Redis clients from shared utility
const { pubClient, subClient } = getSocketRedisClients();

// Allow customizing pingTimeout and pingInterval to avoid 'ping timeout' disconnects
// Default values: pingTimeout 20000ms (20s), pingInterval 25000ms (25s)
// You can override these for tests or production as needed
const SOCKET_PING_TIMEOUT = process.env.SOCKET_PING_TIMEOUT ? Number(process.env.SOCKET_PING_TIMEOUT) : 30000; // 30s
const SOCKET_PING_INTERVAL = process.env.SOCKET_PING_INTERVAL ? Number(process.env.SOCKET_PING_INTERVAL) : 30000; // 30s

const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>({
  cors: corsOptions,
  pingTimeout: SOCKET_PING_TIMEOUT,
  pingInterval: SOCKET_PING_INTERVAL,
});

// Initialize rate limiting and duplicate connection prevention
// const socketRateLimiter = new SocketRateLimiter({
//   windowMs: 60000, // 1 minute
//   maxConnections: 10, // 10 connections per minute per IP
//   blockDuration: 300000, // 5 minutes block
// });

// const duplicateConnectionPreventer = new DuplicateConnectionPreventer();

// Apply rate limiting middleware
// io.use(socketRateLimiter.middleware());

// Apply duplicate connection prevention
// io.use(duplicateConnectionPreventer.middleware(3)); // Max 3 connections per user

// Apply Redis adapter if available
if (pubClient && subClient && !isTest) {
  try {
    const redisAdapter = createAdapter(pubClient, subClient);
    io.adapter(redisAdapter as any); // Type cast to avoid TypeScript issues
    socketLogger.info('Redis adapter initialized successfully');
  } catch (error: any) {
    socketLogger.error('Redis adapter initialization error:', error?.message || 'Unknown error');
    // Continue without Redis adapter
  }
} else {
  socketLogger.info('Redis adapter not available - running in single-process mode');
}

// Legacy exports for backward compatibility and tests
export let onlineProviders: ProviderSocket[] = [];
export let activeOrders: ActiveOrders[] = [];

// Initialize Redis manager and sync legacy arrays
(async () => {
  try {
    const result = await SocketRedisManager.initializeSocketData();
    // Load current data into legacy arrays for backward compatibility
    onlineProviders = await SocketRedisManager.getAllProviders();
    activeOrders = await SocketRedisManager.getAllOrders();
    socketLogger.info(
      `Redis manager initialized successfully - ${result.providers} providers, ${result.orders} orders`,
    );
  } catch (error: any) {
    socketLogger.error('Redis manager initialization error:', error.message);
  }
})();

// Store auto-select contexts to handle provider rejections
type AutoSelectContext = ActiveOrders & {
  customerLatitude: number;
  customerLongitude: number;
  maxDistance: number;
  providersWithDistance: (ProviderSocket & { distance: number })[];
  currentProviderIndex: number;
  customerSocket: any;
  currentTimeoutJobId?: string; // Track current provider timeout job
};

export let autoSelectContexts: Map<number, AutoSelectContext> = new Map();

// Initialize chat functionality
(async () => {
  try {
    await initializeChat(io, prismaClient);
    socketLogger.debug('[SOCKET] Chat functions initialized successfully');
  } catch (error: any) {
    logger.error('Chat initialization error:', {
      error: error.message,
      stack: error.stack,
    });
    socketLogger.error('[SOCKET] Failed to initialize chat:', error.message);
  }
})();

//#region Functions
let arrivalThreshold: number;

async function getArrivalThreshold(): Promise<number> {
  if (arrivalThreshold && arrivalThreshold !== -1) return arrivalThreshold;

  // Calculate arrival threshold based on environment variable or default to 5 minutes
  const threshold = await prisma.constants.findFirst({
    where: {
      Label: {
        equals: Constants.ProviderKMThershold,
      },
    },
    select: {
      Value: true,
    },
  });

  console.log('Fetched arrival threshold from DB:', threshold);

  arrivalThreshold = threshold?.Value ? threshold.Value.toNumber() : 2; // Default to 5 minutes in seconds
  return arrivalThreshold;
}

// Add the seconds

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const broadcasterHelper = (
  socket: CustomSocket,
  event: keyof ServerToClientEvents,
  payload: ServerToClientEvents[typeof event],
  args: BroadcastHelperArgs,
  receiverUuid: string = '',
) => {
  if (args.requestor === args.receiver || socket.id === receiverUuid) {
    // Means emitting to him self
    socket.emit(event, { ...(payload || {}) });
  } else if (receiverUuid) {
    socket.to(receiverUuid).emit(event, { ...(payload || {}) });
  }
};
const prisma = prismaClient;

export const addOrderHistory = async (order: ActiveOrders, reason: OrderHistory, notes: string | undefined) => {
  try {
    logger.info('Adding order history', {
      orderId: order.orderId,
      reason: reason.toString(),
      providerUuid: order.providerUuid,
      customerUuid: order.customerUuid,
      notes: notes,
    });

    await prisma.orderHistory.create({
      data: {
        Notes: notes,
        orders: { connect: { id: order.orderId } },
        orderHistoryItems: { connect: { HistoryName: reason } },
      },
    });
  } catch (error: any) {
    logger.error('Failed to add order history:', {
      orderId: order.orderId,
      reason: reason.toString(),
      error: error.message,
      code: error.code,
    });

    // Don't throw the error to prevent crashes
    socketLogger.error('[SOCKET] Failed to add order history:', error.message);
  }
};

export const broadcastOnlineProvider = async (socket: CustomSocket, moduleId?: number) => {
  const redisOnlineProviders = await SocketRedisManager.getAllProviders();
  const filteredProviders = redisOnlineProviders.filter(
    (provider) => provider.status === ProviderStatus.Online && (moduleId ? provider.moduleId === moduleId : true),
  );
  socketLogger.debug(
    '[SOCKET - Broadcast online providers] Broadcasting online providers, Total Online Providers : ' +
      filteredProviders.length,
  );
  socket.broadcast.emit('online-users', filteredProviders);
  socket.emit('online-users', filteredProviders);
};

export const checkActiveSession = async (
  socket: CustomSocket,
  user: UserInfo | undefined,
  notifcationToken: string,
  userLocation: { longitude: number; latitude: number },
) => {
  // Someone connected to socket and we need to identify if the connected user hace current session
  // If connected is customer => check the current in progress order
  // If connected is provider => check the current in progress order and pass it to order
  let toSearchKey: keyof ActiveOrders;
  if (user?.UserTypeName === 'Customer') {
    toSearchKey = 'customerUserId';
  } else toSearchKey = 'customerUserId';
  if (user?.UserTypeName === 'Provider') {
    toSearchKey = 'providerUserId';
  }
  const order = await getOrder({ searchKey: toSearchKey, searchValue: user?.id || '' });

  // Update the current providers and orders
  if (user?.UserTypeName === 'Customer' && order) {
    let newOrders = activeOrders.filter((aOrder) => aOrder.orderId !== order.orderId);
    activeOrders = [...newOrders, { ...order, customerUuid: socket.id }];

    socketLogger.debug('[SOCKET] Restoring active session [ORDER FOUND] [CUSTOMER]', { order, user });
    broadcasterHelper(
      socket,
      'notify-active-session',
      { type: user?.UserTypeName?.toLowerCase?.() as any, order: { ...order } },
      { requestor: UserTypes.Customer, receiver: UserTypes.Customer },
    );
  }

  if (order) {
    const provider = await getProvider({
      searchKey: 'uuid',
      searchValue: order.providerUuid,
    });

    // Update providerUuid
    //Update providerUuid;
    socketLogger.debug('[SOCKET] Restoring active session [ORDER FOUND]', { order, user, provider });
    if (provider && user?.UserTypeName === 'Provider') {
      // if the current uuid is differnet than the new uuid then make the provider go offline
      if (provider && provider.uuid) {
        socketLogger.debug(
          `[SOCKET] [ACTIVE-SESSION] Provider ${provider.uuid} is going offline. Since they are differnet`,
        );
        socket
          .to(provider.uuid)
          .emit('provider-offline-finish', { result: true, message: 'You have logged in with another device' });
      }
      socketLogger.debug('[SOCKET] Restoring active session [UPDATE PROVIDER]', { order, user, provider });
      await updateProvider({
        newValues: {
          ...provider,
          uuid: socket.id,
          notifcationToken,
          latitude: userLocation.latitude === -1 ? provider.latitude : userLocation.latitude,
          longitude: userLocation.longitude === -1 ? provider.longitude : userLocation.longitude,
        },
        socket,
        searchValue: provider.userId,
        searchKey: 'userId',
      });

      broadcasterHelper(
        socket,
        'provider-online-finish',
        { result: true },
        { requestor: UserTypes.Provider, receiver: UserTypes.Provider },
      );

      socket.join('providers');

      // Wait 500ms for online stuff to be ready at customer side
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user?.UserTypeName === 'Provider')
        await updateOrder({ socket, newValues: { providerUuid: socket.id }, searchValue: order.orderId });

      broadcasterHelper(
        socket,
        'notify-active-session',
        { type: user?.UserTypeName?.toLowerCase?.() as any, order: { ...order, moduleId: provider.moduleId } },
        { requestor: UserTypes.Provider, receiver: UserTypes.Provider },
      );
    } else {
      socketLogger.debug('[SOCKET] No active session found for user', { user });
    }
  } else {
    // Check if provider online but no active orders. so update the socket id
    if (user?.UserTypeName === UserTypes.Provider) {
      const provider = await getProvider({ searchKey: 'userId', searchValue: user.id });
      if (provider) {
        socketLogger.debug(
          '[ACTIVE-SESSION] [PROVIDER] Found an online provider with no orders. updating the id and notification ',
          { user },
        );
        await updateProvider({
          newValues: {
            ...provider,
            uuid: socket.id,
            notifcationToken,
            latitude: userLocation?.latitude === -1 ? provider.latitude : userLocation?.latitude,
            longitude: userLocation?.longitude === -1 ? provider.longitude : userLocation?.longitude,
          },
          socket,
          searchValue: provider.userId,
          searchKey: 'userId',
        });
        if (provider && provider.uuid) {
          socketLogger.debug(
            `[SOCKET] [ACTIVE-SESSION] Provider ${provider.uuid} is going offline. Since they are differnet`,
          );
          socket
            .to(provider.uuid)
            .emit('provider-offline-finish', { result: true, message: 'You have logged in with another device' });
        }
        broadcasterHelper(
          socket,
          'notify-active-session',
          {
            type: 'provider',
            order: null,
          },
          { requestor: UserTypes.Provider, receiver: UserTypes.Provider },
        );
        broadcasterHelper(
          socket,
          'provider-online-finish',
          { result: true },
          { receiver: UserTypes.Provider, requestor: UserTypes.Provider },
        );
      }
    } else socketLogger.debug('[SOCKET] No active session found for user', { user });
  }
};

// #region Providers

const defaultProviderSearchKey: keyof ProviderSocket = 'userId';

export const addProvider: AddService<ProviderSocket> = async ({ newArgs, socket }) => {
  if (!newArgs.uuid) newArgs.uuid = socket.id;

  socketLogger.debug('[SOCKET] [Provider] [Add] => Adding new provdider ' + JSON.stringify({ newArgs }));

  // Use Redis for persistence
  const updatedProviders = await SocketRedisManager.addProvider(newArgs);

  // Update legacy in-memory array for backward compatibility
  onlineProviders = updatedProviders;

  broadcastOnlineProvider(socket);

  socket.emit('provider-online-finish', { result: true });

  socket.join('providers');

  return true;
};

export const updateProvider: UpdateService<ProviderSocket, boolean> = async (
  { newValues, searchKey = defaultProviderSearchKey, searchValue, socket },
  skipBroadcast = false,
) => {
  socketLogger.debug(
    '[SOCKET] [Provider] [Update] => Update provider ' + JSON.stringify({ newValues, searchKey, searchValue }),
  );

  // Use Redis manager for persistence
  const updatedProvider = await SocketRedisManager.updateProvider(searchKey, searchValue, newValues);

  // Update legacy in-memory array for backward compatibility
  onlineProviders = await SocketRedisManager.getAllProviders();

  if (!skipBroadcast) broadcastOnlineProvider(socket);

  return updatedProvider;
};

export const removeProvider: RemoveService<ProviderSocket, boolean, undefined> = async (
  { searchKey = defaultProviderSearchKey, searchValue, socket },
  skipBroadcast = false,
) => {
  socketLogger.debug('[SOCKET] [Provider] [Remove] => Remove provider ' + JSON.stringify({ searchKey, searchValue }));

  // Use Redis manager for persistence
  const removedProvider = await SocketRedisManager.removeProvider(searchKey, searchValue);

  // Update legacy in-memory array for backward compatibility
  onlineProviders = await SocketRedisManager.getAllProviders();

  if (!skipBroadcast) broadcastOnlineProvider(socket);

  socket.emit('provider-offline-finish', { result: true });

  socket.leave('providers');

  return removedProvider;
};

export const getProvider: GetService<ProviderSocket> = async ({
  searchKey = defaultProviderSearchKey,
  searchValue,
}) => {
  // Use Redis manager for data retrieval
  return await SocketRedisManager.getProvider(searchKey, searchValue);
};
// #endregion

// #region Orders
const defaultOrderSearchKey: keyof ActiveOrders = 'orderId';

export const addOrder: AddService<ActiveOrders, BroadcastHelperArgs> = async ({ newArgs, socket }, broadcastArgs) => {
  socketLogger.debug('[SOCKET] [Order] [Add] => Adding new Order ' + JSON.stringify({ newArgs }));

  // Use Redis manager for persistence
  const updatedOrders = await SocketRedisManager.addOrder(newArgs);

  // Update legacy in-memory array for backward compatibility
  activeOrders = updatedOrders;

  if (broadcastArgs) broadcasterHelper(socket, 'notify-order-add', { ...newArgs }, broadcastArgs, newArgs.providerUuid);

  return true;
};

export const updateOrder: UpdateService<ActiveOrders, { reason: OrderHistory; notes: string }> = async (
  { newValues, searchValue, searchKey = defaultOrderSearchKey },
  reason,
) => {
  socketLogger.debug(
    '[SOCKET] [Order] [Update] => Update Order ' + JSON.stringify({ newValues, searchKey, searchValue }),
  );

  // Use Redis manager for persistence
  const updatedOrder = await SocketRedisManager.updateOrder(searchKey, searchValue, newValues);

  // Update legacy in-memory array for backward compatibility
  activeOrders = await SocketRedisManager.getAllOrders();

  if (reason && updatedOrder) await addOrderHistory(updatedOrder, reason.reason, reason.notes);

  return updatedOrder;
};

export const removeOrder: RemoveService<
  ActiveOrders,
  { reason: OrderHistory; notes: string },
  BroadcastHelperArgs
> = async ({ searchValue, socket, searchKey = defaultOrderSearchKey }, reason, broadcastArgs) => {
  socketLogger.debug('[SOCKET] [Order] [Remove] => Remove Order ' + JSON.stringify({ searchKey, searchValue }));

  // Use Redis manager for persistence
  const removedOrder = await SocketRedisManager.removeOrder(searchKey, searchValue);

  // Update legacy in-memory array for backward compatibility
  activeOrders = await SocketRedisManager.getAllOrders();

  if (reason && removedOrder && broadcastArgs) {
    await addOrderHistory(removedOrder, reason.reason, reason.notes);

    broadcasterHelper(socket, 'notify-order-remove', { ...removedOrder }, broadcastArgs, removedOrder.providerUuid);

    if (removedOrder.orderStep !== OrderStep.stillNotAcceptedByProvider0)
      broadcasterHelper(
        socket,
        'notify-active-order-remove',
        { ...removedOrder },
        broadcastArgs,
        removedOrder.providerUuid,
      );
  }

  return removedOrder;
};

export const getOrder: GetService<ActiveOrders> = async ({ searchValue, searchKey = defaultOrderSearchKey }) => {
  // Use Redis manager for data retrieval
  return await SocketRedisManager.getOrder(searchKey, searchValue);
};

// Function to continue auto-select process after provider rejection/timeout
const continueAutoSelectProcess = async (orderId: number, reason: 'rejection' | 'timeout' | 'initial' = 'initial') => {
  const context = autoSelectContexts.get(orderId);
  if (!context) {
    socketLogger.debug('[SOCKET] [AUTO-SELECT] No context found for order', { orderId });
    return;
  }

  socketLogger.debug('[SOCKET] [AUTO-SELECT] Continuing process after provider', {
    reason,
    orderId,
    currentIndex: context.currentProviderIndex,
    totalProviders: context.providersWithDistance.length,
  });

  // Cancel any existing timeout for the current provider
  if (context.currentTimeoutJobId) {
    try {
      schedule.cancelJob(context.currentTimeoutJobId);
      socketLogger.debug('[SOCKET] [AUTO-SELECT] Cancelled previous timeout job', {
        orderId,
        cancelledJobId: context.currentTimeoutJobId,
        reason,
      });
    } catch (error) {
      socketLogger.debug('[SOCKET] [AUTO-SELECT] Error cancelling previous timeout job', {
        orderId,
        jobId: context.currentTimeoutJobId,
        error,
      });
    }
    context.currentTimeoutJobId = undefined;
  }

  // If this is called for rejection or timeout, move to next provider
  // For initial call, start with the current index (0)
  if (reason === 'rejection' || reason === 'timeout') {
    context.currentProviderIndex++;
  }

  // Check if we've exhausted all providers
  if (context.currentProviderIndex >= context.providersWithDistance.length) {
    socketLogger.debug('[SOCKET] [AUTO-SELECT] All providers exhausted', { orderId });

    // Cleanup context
    autoSelectContexts.delete(orderId);

    // Notify customer that all providers were tried but none accepted
    sendNotification({
      data: { orderId, triedProviders: context.providersWithDistance.length },
      description: `All ${context.providersWithDistance.length} nearby providers were contacted but none are available`,
      expoToken: context.customerNotificationToken,
      title: 'No Available Providers',
    });

    cancelOnHoldPayment(context);
    socketLogger.debug('[SOCKET] [AUTO-SELECT] All providers exhausted', { orderId });
    context.customerSocket.emit('order-timeout', {
      message: 'All providers were tried but none accepted the order.',
      orderDead: true,
    });
    return;
  }

  // Try current provider (or next provider if we just incremented)
  const currentProvider = context.providersWithDistance[context.currentProviderIndex];
  socketLogger.debug('[SOCKET] [AUTO-SELECT] Trying provider', {
    providerId: currentProvider.providerId,
    distance: currentProvider.distance,
    index: context.currentProviderIndex + 1,
    total: context.providersWithDistance.length,
    reason,
  });

  const latestProviderData = await SocketRedisManager.getProvider('userId', currentProvider.userId);

  if (latestProviderData)
    // Add order with current provider
    await addOrder(
      {
        socket: context.customerSocket,
        newArgs: {
          arrivalThreshold: await getArrivalThreshold(),
          orderPaymentMethod: context.orderPaymentMethod,
          orderSubmissionType: 'auto-select',
          orderTimeoutSeconds: getTimeoutObject(ORDER_TIMEOUT_SECONDS),
          customerUuid: context.customerUuid,
          orderId: context.orderId,
          customerUserId: context.customerUserId,
          customerNotificationToken: context.customerNotificationToken,
          providerUserId: latestProviderData.userId,
          providerUuid: latestProviderData.uuid,
          orderStep: OrderStep.stillNotAcceptedByProvider0,
        },
      },
      { receiver: UserTypes.Provider, requestor: UserTypes.Customer },
    );

  // Set timeout for provider response
  const providerResponseTimeout = Number(envVars.order.timeout);

  // Notify customer about current provider being tried
  context.customerSocket.emit('auto-select-provider-notified', {
    orderId: context.orderId,
    providerId: currentProvider.providerId,
    distance: Math.round(currentProvider.latitude * 100) / 100,
    currentIndex: context.currentProviderIndex + 1,
    totalProviders: context.providersWithDistance.length,
    timeout: getTimeoutObject(providerResponseTimeout),
  });

  // Send notification to provider
  sendNotification({
    data: { orderId: context.orderId, autoSelect: true, distance: currentProvider.distance },
    description: `You have received a new order (${Math.round(currentProvider.distance * 100) / 100}km away)`,
    expoToken: currentProvider.notifcationToken,
    title: 'New Auto-Selected Order',
  });

  // Schedule timeout for this provider
  const timeOutDate = addSeconds(new Date(), providerResponseTimeout);
  const timeoutJobId = `auto-select-timeout-${orderId}-${context.currentProviderIndex}-${Date.now()}`;

  // Store the timeout job ID in context for cancellation
  context.currentTimeoutJobId = timeoutJobId;

  socketLogger.debug('[SOCKET] [AUTO-SELECT] Scheduling timeout job', {
    orderId,
    providerId: currentProvider.providerId,
    timeoutSeconds: providerResponseTimeout,
    timeoutDate: timeOutDate,
    jobId: timeoutJobId,
    providerIndex: context.currentProviderIndex,
  });

  schedule.scheduleJob(timeoutJobId, timeOutDate, async function () {
    socketLogger.debug('[SOCKET] [AUTO-SELECT] Timeout job executing', {
      orderId,
      providerId: currentProvider.providerId,
      jobId: timeoutJobId,
    });

    const currentOrder = await getOrder({ searchValue: orderId });
    const currentContext = autoSelectContexts.get(orderId);

    socketLogger.debug('[SOCKET] [AUTO-SELECT] Timeout job - checking order state', {
      orderId,
      orderExists: !!currentOrder,
      orderStep: currentOrder?.orderStep,
      contextExists: !!currentContext,
      providerId: currentProvider.providerId,
      isCurrentJob: currentContext?.currentTimeoutJobId === timeoutJobId,
    });

    // Only proceed if this is still the current timeout job and order is not accepted
    if (
      currentOrder &&
      currentOrder.orderStep === OrderStep.stillNotAcceptedByProvider0 &&
      currentContext &&
      currentContext.currentTimeoutJobId === timeoutJobId
    ) {
      socketLogger.debug('[SOCKET] [AUTO-SELECT] Provider timeout confirmed, trying next provider', {
        providerId: currentProvider.providerId,
        orderId,
        currentStep: currentOrder.orderStep,
      });

      // Clear the timeout job ID since we're about to process it
      currentContext.currentTimeoutJobId = undefined;

      // Remove current order
      await removeOrder(
        { searchValue: orderId, socket: context.customerSocket },
        {
          reason: OrderHistory.Timeout,
          notes: `Provider timeout during auto-select. Seconds: ${providerResponseTimeout}`,
        },
        {
          receiver: UserTypes.Provider,
          requestor: UserTypes.Customer,
        },
      );

      // Continue with next provider
      continueAutoSelectProcess(orderId, 'timeout');
    } else {
      socketLogger.debug('[SOCKET] [AUTO-SELECT] Timeout job cancelled - order was accepted, removed, or superseded', {
        orderId,
        orderExists: !!currentOrder,
        orderStep: currentOrder?.orderStep,
        contextExists: !!currentContext,
        providerId: currentProvider.providerId,
        isCurrentJob: currentContext?.currentTimeoutJobId === timeoutJobId,
        currentJobId: currentContext?.currentTimeoutJobId,
      });
    }
  });
};
// #endregion

// #endregion

// #region IO Auth
io.use((socket, next) => {
  try {
    const apiValue = socket.handshake.auth[envVars.auth.apiKey];
    apiAuthMiddleware(apiValue);
    // inject user id coming from socket
    socket.data.userInfo = socket.handshake.auth['userInfo'];
    logger.info('Socket connected successfully', {
      socketId: socket.id,
      userId: socket.data.userInfo?.id,
    });
    next();
  } catch (error: any) {
    logger.error('Socket connection error', {
      error: error?.message || error,
      socketId: socket.id,
    });
    next(error);
  }
});
// #endregion

io.on('connect', (socket) => {
  const user = socket.data.userInfo;
  socketLogger.debug('user', user);

  // checkActiveSession(socket, user);
});

// #region Chat System

io.on('connection', (socket) => {
  try {
    // Chat event listeners
    socket.on('chat-authenticate', async (data: ChatAuthenticationPayload) => {
      try {
        const result = await authenticateUser(data.userId);
        if (result) {
          // Store user info on socket
          (socket as any).userId = result.userId;
          (socket as any).userType = result.userType;

          // Update online status
          updateUserOnlineStatus(result.userId, socket.id, true);

          socket.emit('chat-authenticated', result);
          socketLogger.debug(`Chat: User ${result.userId} (${result.userType}) authenticated`);
        } else {
          socket.emit('chat-authentication-failed', { error: 'Invalid user' });
        }
      } catch (error: any) {
        socketLogger.error('Chat authentication error:', error);
        socket.emit('chat-authentication-failed', { error: 'Authentication failed' });
      }
    });

    socket.on('chat-join-order', async (data: JoinOrderChatPayload) => {
      const userId = (socket as any).userId;
      if (!userId) {
        const error: ChatErrorPayload = { message: 'Not authenticated' };
        socket.emit('chat-error', error);
        return;
      }

      try {
        const result = await joinOrderChat(userId, data.orderId);
        if (result) {
          const roomName = `order_chat_${data.orderId}`;
          socket.join(roomName);

          socket.emit('chat-joined-order', result);

          // Notify others in the room
          const joinNotification: UserJoinedChatPayload = {
            orderId: data.orderId,
            userId: userId,
            userType: (socket as any).userType!,
            userName: result.participants.find((p) => p.userId === userId)?.userName || 'Unknown',
            joinedAt: new Date(),
          };

          socket.to(roomName).emit('chat-user-joined', joinNotification);

          // Send recent messages
          try {
            const history = await getChatHistory(data.orderId);
            socket.emit('chat-history', history);
          } catch (historyError) {
            socketLogger.error('Failed to send chat history:', historyError);
          }

          socketLogger.debug(`User ${userId} joined order chat ${data.orderId}`);
        } else {
          const error: ChatErrorPayload = {
            message: 'Not authorized for this order chat',
            orderId: data.orderId,
          };
          socket.emit('chat-error', error);
        }
      } catch (error: any) {
        socketLogger.error('Join order chat error:', error);
        const errorPayload: ChatErrorPayload = {
          message: 'Failed to join order chat',
          orderId: data.orderId,
        };
        socket.emit('chat-error', errorPayload);
      }
    });

    socket.on('chat-leave-order', (data: LeaveOrderChatPayload) => {
      const userId = (socket as any).userId;
      if (!userId) return;

      const roomName = `order_chat_${data.orderId}`;
      socket.leave(roomName);

      // Stop typing if user was typing
      stopTyping(userId, data.orderId);

      // Notify others
      const leftNotification: UserLeftChatPayload = {
        orderId: data.orderId,
        userId: userId,
        userType: (socket as any).userType!,
        leftAt: new Date(),
      };

      socket.to(roomName).emit('chat-user-left', leftNotification);
    });

    socket.on('chat-typing', (data: TypingIndicatorPayload) => {
      const userId = (socket as any).userId;
      if (!userId) return;

      let typingNotification: UserTypingNotification | null = null;

      if (data.isTyping) {
        typingNotification = startTyping(userId, data.orderId);
      } else {
        stopTyping(userId, data.orderId);
        typingNotification = {
          orderId: data.orderId,
          userId: userId,
          userType: (socket as any).userType!,
          userName: 'Unknown',
          isTyping: false,
        };
      }

      if (typingNotification) {
        socket.to(`order_chat_${data.orderId}`).emit('chat-user-typing', typingNotification);
      }
    });

    socket.on('chat-send-message', async (data: SendMessagePayload) => {
      const userId = (socket as any).userId;
      if (!userId) {
        const error: ChatErrorPayload = { message: 'Not authenticated' };
        socket.emit('chat-error', error);
        return;
      }

      try {
        const result = await sendMessage(userId, data);
        if (result && result.message) {
          // Broadcast to order room
          const notification: NewMessageNotification = {
            message: result.message,
            orderId: data.orderId,
            isSystemMessage: false,
          };

          socket.to(`order_chat_${data.orderId}`).emit('chat-new-message', notification);

          // Stop typing for sender
          stopTyping(userId, data.orderId);

          // Send confirmation to sender
          socket.emit('chat-message-sent', result);

          socketLogger.debug(`Message sent in order ${data.orderId} by user ${userId}`);
        } else {
          const errorPayload: ChatErrorPayload = {
            message: 'Failed to send message or message too long',
            orderId: data.orderId,
          };
          socket.emit('chat-error', errorPayload);
        }
      } catch (error: any) {
        socketLogger.error('Send message error:', error);
        const errorPayload: ChatErrorPayload = {
          message: 'Failed to send message',
          orderId: data.orderId,
        };
        socket.emit('chat-error', errorPayload);
      }
    });

    socket.on('chat-get-history', async (data: GetChatHistoryPayload) => {
      const userId = (socket as any).userId;
      if (!userId) {
        const error: ChatErrorPayload = { message: 'Not authenticated' };
        socket.emit('chat-error', error);
        return;
      }

      try {
        const history = await getChatHistory(data.orderId, data.page, data.limit);
        socket.emit('chat-history', history);
      } catch (error: any) {
        socketLogger.error('Get chat history error:', error);
        const errorPayload: ChatErrorPayload = {
          message: 'Failed to get chat history',
          orderId: data.orderId,
        };
        socket.emit('chat-error', errorPayload);
      }
    });

    // Add error handler for this socket
    socket.on('error', (error) => {
      logger.error('Socket error:', {
        socketId: socket.id,
        error: error.message,
        userId: socket.data?.userInfo?.id,
      });
      socketLogger.error('[SOCKET] Socket error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      const userId = (socket as any).userId;

      // Handle chat disconnection
      if (userId) {
        handleUserDisconnect(userId);
      }

      logger.info('Socket disconnected:', {
        socketId: socket.id,
        reason,
        userId: socket.data?.userInfo?.id || userId,
      });
      socketLogger.debug('[SOCKET] Socket disconnected:', reason);
    });

    // socket.on('connect', () => {
    //   //@ts-ignore
    //   socketLogger.debug("user", socket.userId)
    // })
    socket.on('force-check-active-session', (args) => {
      try {
        socketLogger.debug('[SOCKET] [FORCE] Force checking active session', { user: args.user });
        checkActiveSession(socket, args.user, args.notificationToken, args.updatedLocation);
      } catch (error: any) {
        logger.error('Error in force-check-active-session:', {
          error: error.message,
          socketId: socket.id,
          user: args.user,
        });
        socketLogger.error('[SOCKET] force-check-active-session error:', error.message);
      }
    });

    socket.on('provider-online-start', async (args) => {
      try {
        if ((!socket.id && !args.uuid) || !args.userId || !args.providerId) {
          socketLogger.debug('No enough args ', { args });
          socket.emit('provider-online-finish', { result: false });
          return;
        }

        let orderFound = false;
        // Check if provider is already online0
        const online = await getProvider({ searchKey: 'providerId', searchValue: args.providerId });
        if (online) {
          // Check if provider has active order
          const order = await getOrder({ searchValue: online.uuid, searchKey: 'providerUuid' });
          if (order) {
            orderFound = true;
            socketLogger.debug('[SOCKET] [PROVIDER-ONLINE-START] Checking active session', { online });
            await checkActiveSession(socket, { id: online.userId, UserTypeName: 'Provider' }, args.notifcationToken, {
              latitude: args.latitude,
              longitude: args.longitude,
            });
            return;
          }
        }

        if (online) {
          // if provider has active order. Then switch to the new client.
          updateProvider({
            socket,
            newValues: {
              uuid: socket.id,
              notifcationToken: args.notifcationToken,
              status: orderFound ? ProviderStatus.HaveOrder : ProviderStatus.Online,
            },
            searchValue: online.userId,
          });
          socket.emit('provider-online-finish', { result: true });
        } else addProvider({ socket, newArgs: { ...args } });
      } catch (error: any) {
        logger.error('Error in provider-online-start:', {
          error: error.message,
          socketId: socket.id,
          args,
        });
        socketLogger.error('[SOCKET] provider-online-start error:', error.message);
        socket.emit('provider-online-finish', { result: false });
      }
    });

    socket.on('provider-offline-start', (args) => {
      try {
        removeProvider({ searchValue: socket.id, searchKey: 'uuid', socket });
      } catch (error: any) {
        logger.error('Error in provider-offline-start:', {
          error: error.message,
          socketId: socket.id,
        });
        socketLogger.error('[SOCKET] provider-offline-start error:', error.message);
      }
    });

    socket.on('provider-online-location-change', async (args) => {
      try {
        // let provider = getProvider({ searchValue: args.userId });

        const provider = await updateProvider({ socket, newValues: { ...args }, searchValue: args.userId }, true);

        const order = await getOrder({ searchValue: socket.id, searchKey: 'providerUuid' });

        socketLogger.debug('Provider location change', { order, args });
        //Provider have an active order;
        if (order && provider) {
          socketLogger.debug('Order found');

          socket.to(order.customerUuid).emit('provider-to-customer-location-change', {
            latitude: args.latitude,
            longitude: args.longitude,
            providerId: provider.providerId,
            userId: provider.userId,
          });
        } else {
          socketLogger.debug('[SOCKET] Provider location update - no active order found (this is normal)');
        }
      } catch (error: any) {
        logger.error('Error in provider-online-location-change:', {
          error: error.message,
          socketId: socket.id,
          args,
        });
        socketLogger.error('[SOCKET] provider-online-location-change error:', error.message);
      }
    });

    socket.on('new-order', async (args) => {
      try {
        const selectedProvider = await getProvider({ searchKey: 'providerId', searchValue: args.providerId });

        if (!selectedProvider) {
          //@ts-ignore
          cancelOnHoldPayment({ orderId: args.orderId });
          socket.emit('order-timeout', { message: "Provider wen't offline" });
          return;
        }

        // Check if customer have any in progress order
        const currentCustomerOrder = await getOrder({ searchValue: args.customrUserId, searchKey: 'customerUserId' });
        if (currentCustomerOrder) {
          if (currentCustomerOrder.orderStep === OrderStep.stillNotAcceptedByProvider0) {
            socketLogger.debug('[SOCKET] Customer already has an order that is not accepted by provider');
            const order = await removeOrder(
              { socket, searchValue: currentCustomerOrder.orderId, searchKey: 'orderId' },
              {
                reason: OrderHistory.Cancelled,
                notes: 'Customer has an active order (still not accepted by provider) and he is creating a new one',
              },
              { requestor: UserTypes.Customer, receiver: UserTypes.Customer },
            );
            if (order) cancelOnHoldPayment(order);
          } else {
            socket.emit('order-rejected', {
              message: 'You have an existing active order.',
              result: false,
              orderId: currentCustomerOrder.orderId,
              orderStep: currentCustomerOrder.orderStep,
            });
            return;
          }
        }

        await addOrder(
          {
            socket,
            newArgs: {
              arrivalThreshold: await getArrivalThreshold(),
              orderPaymentMethod: args.orderPaymentMethod,
              orderSubmissionType: 'provider-select',
              orderTimeoutSeconds: getTimeoutObject(ORDER_TIMEOUT_SECONDS),
              customerUuid: socket.id, // because customer is the one who created the order
              orderId: args.orderId,
              customerUserId: args.customrUserId,
              customerNotificationToken: args.customerNotificationToken,
              providerUserId: selectedProvider.userId,
              providerUuid: selectedProvider?.uuid,
              orderStep: OrderStep.stillNotAcceptedByProvider0,
            },
          },
          { receiver: UserTypes.Provider, requestor: UserTypes.Customer },
        );

        // TEST = 5
        const timeOutDate = addSeconds(new Date(), ORDER_TIMEOUT_SECONDS);

        sendNotification({
          data: {},
          description: 'You have received a new order',
          expoToken: selectedProvider.notifcationToken,
          title: 'New order',
        });

        //Order timeout schedule job
        const timeoutJobId = `order-timeout-${args.orderId}`;

        socketLogger.debug('[SOCKET] [NEW-ORDER] Scheduling timeout job', {
          orderId: args.orderId,
          providerId: args.providerId,
          timeoutSeconds: ORDER_TIMEOUT_SECONDS,
          timeoutDate: timeOutDate,
          jobId: timeoutJobId,
        });

        schedule.scheduleJob(timeoutJobId, timeOutDate, async function () {
          socketLogger.debug('[SOCKET] [NEW-ORDER] Timeout job executing', {
            orderId: args.orderId,
            providerId: args.providerId,
            jobId: timeoutJobId,
          });

          const order = await getOrder({ searchValue: args.orderId, searchKey: 'orderId' });
          const selectedProviderTimeout = await getProvider({ searchKey: 'providerId', searchValue: args.providerId });

          socketLogger.debug('[SOCKET] [NEW-ORDER] Timeout job - checking order state', {
            orderId: args.orderId,
            orderExists: !!order,
            orderStep: order?.orderStep,
            providerExists: !!selectedProviderTimeout,
            providerId: args.providerId,
          });

          // Only execute timeout if order still exists and is not accepted
          if (order?.orderStep === OrderStep.stillNotAcceptedByProvider0) {
            socketLogger.debug('[SOCKET] [NEW-ORDER] Order timeout confirmed - order not accepted', {
              orderId: order.orderId,
              currentStep: order.orderStep,
            });

            socket.emit('order-timeout', {
              message: `Timeout of ${ORDER_TIMEOUT_SECONDS} seconds is done. No response received.`,
            });

            const removedOrder = await removeOrder(
              { searchValue: args.orderId, socket },
              { reason: OrderHistory.Timeout, notes: `The timeout date` },
              {
                receiver: UserTypes.Provider,
                requestor: UserTypes.Customer,
              },
            );

            if (removedOrder) cancelOnHoldPayment(removedOrder);
          } else {
            socketLogger.debug('[SOCKET] [NEW-ORDER] Timeout job cancelled - order was accepted or removed', {
              orderId: args.orderId,
              orderExists: !!order,
              orderStep: order?.orderStep,
              providerId: args.providerId,
            });
          }
        });
      } catch (error: any) {
        logger.error('Error in new-order:', {
          error: error.message,
          socketId: socket.id,
          args,
        });
        socketLogger.error('[SOCKET] new-order error:', error.message);
        cancelOnHoldPayment({ orderId: args.orderId });
        socket.emit('order-timeout', { message: 'Error occurred while processing your order.' });
      }
    });

    socket.on('verify-order', async (args) => {
      const { orderId, userType, userId } = args;

      socketLogger.debug('[SOCKET] Verify order started', { orderId, userType, userId });

      const order = await getOrder({ searchValue: orderId, searchKey: 'orderId' });

      broadcasterHelper(
        socket,
        'order-verify-result',
        { result: Boolean(order), orderId },
        {
          receiver: userType as UserTypes,
          requestor: userType as UserTypes,
        },
      );
    });

    socket.on('auto-select-order', async (args) => {
      const {
        orderId,
        customerUuid,
        customrUserId,
        customerLatitude,
        customerLongitude,
        customerNotificationToken,
        moduleId,
        maxDistance = 200, // Default 200km radius
      } = args;

      socketLogger.debug('[SOCKET] Auto-select order started', {
        orderId,
        customerLatitude,
        customerLongitude,
        maxDistance,
      });

      // Check if customer have any in progress order
      const currentCustomerOrder = await getOrder({ searchValue: customrUserId, searchKey: 'customerUserId' });
      if (currentCustomerOrder) {
        socket.emit('order-rejected', {
          message: 'You have an existing active order.',
          result: false,
          orderId: currentCustomerOrder.orderId,
          orderStep: currentCustomerOrder.orderStep,
        });
        return;
      }

      // Get all online providers for the specific module
      const redisOnlineProviders = await SocketRedisManager.getAllProviders();

      const availableProviders = redisOnlineProviders.filter(
        (provider) => provider.status === ProviderStatus.Online && provider.moduleId === moduleId,
      );

      if (availableProviders.length === 0) {
        socketLogger.debug('[SOCKET] [AUTO-SELECT] No available providers found');

        // Notify customer that no providers are available
        sendNotification({
          data: { orderId },
          description: 'No providers are currently available in your area',
          expoToken: customerNotificationToken,
          title: 'No Providers Available',
        });

        addOrderHistory(
          {
            arrivalThreshold: -1,
            orderPaymentMethod: PaymentMethods.Cash, // Default to online payment
            orderId,
            customerUuid,
            customerUserId: customrUserId,
            customerNotificationToken,
            orderStep: OrderStep.stillNotAcceptedByProvider0,
            orderSubmissionType: 'auto-select',
            orderTimeoutSeconds: getTimeoutObject(ORDER_TIMEOUT_SECONDS),
            providerUserId: -1,
            providerUuid: '',
          },
          OrderHistory.Cancelled,
          'No any providers available/online for auto-select order',
        );

        cancelOnHoldPayment({ orderId, orderPaymentMethod: args.orderPaymentMethod });
        socketLogger.debug(
          '[SOCKET] [AUTO-SELECT] No providers available for auto-select order - sending order-timeout',
          {
            orderId,
          },
        );
        socket.emit('order-timeout', {
          orderDead: true,
          message:
            'Tried auto-selection but currently no providers are currently available/online in the app. You may try again later.',
        });
        return;
      }

      // Calculate distances and filter by maxDistance
      const providersWithDistance = availableProviders
        .map((provider) => ({
          ...provider,
          distance: calculateDistance(customerLatitude, customerLongitude, provider.latitude, provider.longitude),
        }))
        //.filter((provider) => provider.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

      if (providersWithDistance.length === 0) {
        socketLogger.debug('[SOCKET] No providers found within distance', { maxDistance });

        // Notify customer that no providers are within range
        sendNotification({
          data: { orderId, maxDistance },
          description: `No providers found within ${maxDistance}km of your location`,
          expoToken: customerNotificationToken,
          title: 'No Nearby Providers',
        });

        cancelOnHoldPayment({ orderId, orderPaymentMethod: args.orderPaymentMethod });
        socket.emit('order-timeout', { orderDead: true, message: 'No providers are currently near your area.' });
        return;
      }

      socketLogger.debug('[SOCKET] Found providers within distance', {
        count: providersWithDistance.length,
        distances: providersWithDistance.map((p) => ({ id: p.providerId, distance: p.distance })),
      });

      // Store auto-select context for handling rejections/timeouts
      const autoSelectContext: AutoSelectContext = {
        orderId,
        customerUuid,
        customerUserId: customrUserId,
        orderPaymentMethod: args.orderPaymentMethod || PaymentMethods.Cash, // Default to cash if not provided
        customerLatitude,
        customerLongitude,
        customerNotificationToken,
        orderStep: OrderStep.stillNotAcceptedByProvider0,
        orderSubmissionType: 'auto-select',
        orderTimeoutSeconds: getTimeoutObject(ORDER_TIMEOUT_SECONDS),
        providerUserId: -1, // No provider selected yet
        providerUuid: '',
        maxDistance,
        providersWithDistance,
        currentProviderIndex: 0,
        customerSocket: socket,
        arrivalThreshold: await getArrivalThreshold(),
      };
      autoSelectContexts.set(orderId, autoSelectContext);

      // Notify customer that auto-select has started
      socket.emit('auto-select-order-started', {
        orderId,
        totalProviders: providersWithDistance.length,
        maxDistance,
      });

      // Start the auto-select process
      continueAutoSelectProcess(orderId, 'initial');
    });

    socket.on('all-online-providers', (moduleId) => {
      broadcastOnlineProvider(socket, moduleId);
    });

    socket.on('provider-accept-order', async (args) => {
      const order = await getOrder({ searchValue: args.orderId });

      if (order) {
        socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Order found , OrderID : ' + order.orderId);

        // Cancel any pending timeout jobs for this order
        const regularTimeoutJobId = `order-timeout-${args.orderId}`;
        const autoSelectContext = autoSelectContexts.get(args.orderId);

        try {
          schedule.cancelJob(regularTimeoutJobId);
          socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Cancelled regular timeout job', {
            orderId: args.orderId,
            regularTimeoutJobId,
          });
        } catch (error) {
          socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Error cancelling regular timeout job (job may not exist)', {
            orderId: args.orderId,
            error: error,
          });
        }

        // Cancel auto-select timeout job if it exists
        if (autoSelectContext?.currentTimeoutJobId) {
          try {
            schedule.cancelJob(autoSelectContext.currentTimeoutJobId);
            socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Cancelled auto-select timeout job', {
              orderId: args.orderId,
              autoSelectTimeoutJobId: autoSelectContext.currentTimeoutJobId,
            });
          } catch (error) {
            socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Error cancelling auto-select timeout job', {
              orderId: args.orderId,
              jobId: autoSelectContext.currentTimeoutJobId,
              error: error,
            });
          }
        }

        // Clean up auto-select context if this was an auto-select order
        if (order.orderSubmissionType === 'auto-select') {
          const selectedProvider = await getProvider({ searchValue: order.providerUserId, searchKey: 'userId' });
          autoSelectContexts.delete(args.orderId);
          socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Cleaned up auto-select context for accepted order');
          socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Trying to update order', {
            orderId: args.orderId,
            providerId: selectedProvider?.providerId,
          });

          // Update order to assign the provider
          await prisma.orders.update({
            data: {
              ProviderID: selectedProvider?.providerId,
            },
            where: {
              id: args.orderId,
            },
          });
        }

        // Set provider status to have order
        const provider = await updateProvider({
          newValues: { status: ProviderStatus.HaveOrder },
          searchValue: order.providerUuid,
          socket,
          searchKey: 'uuid',
        });

        const updatedOrder = await updateOrder(
          {
            newValues: {
              orderStep: OrderStep.inProgressNotArrived1,
              providerUserId: provider?.userId,
              providerUuid: provider?.uuid,
            },
            searchValue: args.orderId,
            socket,
          },
          {
            reason: OrderHistory.Accepted,
            notes: `Provider has accepted the order. ${
              order?.orderSubmissionType === 'auto-select'
                ? `Auto-select done. Provider Id ${provider?.providerId}`
                : ''
            }`,
          },
        );

        socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Provider updated', { provider, updatedOrder });

        if (updatedOrder && provider) {
          socketLogger.debug('[SOCKET] [ORDER-ACCEPT] Notifying customer about order acceptance', {
            orderId: updatedOrder.orderId,
            providerId: provider.providerId,
            userId: provider.userId,
            orderStep: updatedOrder.orderStep,
          });
          socket.to(args.customerUuid).emit('order-accepted', {
            result: true,
            orderId: updatedOrder.orderId,
            providerId: provider.providerId,
            userId: provider.userId,
            orderStep: updatedOrder.orderStep,
            message: '',
          });

          // Emit auto-select completion event
          socket.to(args.customerUuid).emit('auto-select-order-completed', {
            orderId: updatedOrder.orderId,
            success: true,
            selectedProviderId: provider.providerId,
          });

          sendNotification({
            data: {},
            description: 'Order accepted',
            title: 'Your provider on his way',
            expoToken: updatedOrder.customerNotificationToken,
          });

          socket.emit('set-active-order', {
            orderId: updatedOrder.orderId,
            orderStep: OrderStep.inProgressNotArrived1,
          });

          // Send system message to order chat
          try {
            sendSystemMessage(updatedOrder.orderId, `Order accepted by ${provider.userId}. Provider is on the way!`);
          } catch (error: any) {
            logger.error('Failed to send system message on order accept:', {
              orderId: updatedOrder.orderId,
              error: error.message,
            });
            socketLogger.error('[SOCKET] Failed to send system message:', error.message);
          }

          // Add this emit to send the customer current provider location

          socket.to(args.customerUuid).emit('provider-to-customer-location-change', {
            ...provider,
          });
        }
      }
    });

    socket.on('provider-reject-order', async (args) => {
      const order = await getOrder({ searchValue: args.orderId });

      if (!order) {
        socketLogger.debug('[SOCKET] [PROVIDER-REJECT] Order not found', { orderId: args.orderId });
        return;
      }

      // Check if this is an auto-select order
      const isAutoSelectOrder = order.orderSubmissionType === 'auto-select';

      if (isAutoSelectOrder) {
        socketLogger.debug('[SOCKET] [PROVIDER-REJECT] Auto-select order rejected, moving to next provider', {
          orderId: args.orderId,
          rejectedProviderId: order.providerUserId,
        });

        // Remove the current order
        removeOrder(
          { searchValue: args.orderId, socket },
          { reason: OrderHistory.Rejected, notes: 'Provider has rejected the auto-select order' },
          {
            requestor: UserTypes.Provider,
            receiver: UserTypes.Customer,
          },
        );

        // Continue auto-select process with next provider
        continueAutoSelectProcess(args.orderId, 'rejection');
        return; // Don't send order-rejected for auto-select orders
      }

      // For non-auto-select orders, handle rejection normally
      const removedOrder = await removeOrder(
        { searchValue: args.orderId, socket },
        { reason: OrderHistory.Rejected, notes: 'Provider has rejected the order' },
        {
          requestor: UserTypes.Provider,
          receiver: UserTypes.Provider,
        },
      );

      socketLogger.debug('[SOCKET] [PROVIDER-REJECT] Removed order result:', {
        orderId: args.orderId,
        removedOrder: removedOrder ? 'exists' : 'null',
        customerUuid: args.customerUuid,
        removedOrderCustomerUuid: removedOrder?.customerUuid,
      });

      if (removedOrder) {
        sendNotification({
          data: {},
          description: 'Order Rejected',
          title: 'Unfortunately, Provider has rejected the order. You can choose another provider',
          expoToken: removedOrder?.customerNotificationToken,
        });

        cancelOnHoldPayment(removedOrder);

        socketLogger.debug('[SOCKET] [PROVIDER-REJECT] Emitting order-rejected to:', {
          targetUuid: args.customerUuid || removedOrder.customerUuid,
          providedCustomerUuid: args.customerUuid,
          orderCustomerUuid: removedOrder.customerUuid,
          socketId: socket.id,
        });

        // Try both the provided customerUuid and the stored customerUuid
        const targetUuid = args.customerUuid || removedOrder.customerUuid;
        if (targetUuid) {
          socket.to(targetUuid).emit('order-rejected', {
            result: false,
            orderId: args.orderId,
            orderStep: OrderStep.stillNotAcceptedByProvider0,
          });
        }

        // Also try the stored customerUuid if different from provided one
        if (removedOrder.customerUuid && removedOrder.customerUuid !== args.customerUuid) {
          socket.to(removedOrder.customerUuid).emit('order-rejected', {
            result: false,
            orderId: args.orderId,
            orderStep: OrderStep.stillNotAcceptedByProvider0,
          });
        }
      } else {
        socketLogger.debug('[SOCKET] [PROVIDER-REJECT] No removed order found for orderId:', args.orderId);
      }
    });

    socket.on('customer-reject-inprogress-order', async (args) => {
      socketLogger.debug('[SOCKET] Customer rejected in progress order', { args });
      const order = await removeOrder(
        { searchValue: args.orderId, searchKey: 'orderId', socket },
        { reason: OrderHistory.CustomerCancelled, notes: 'Customer has cancelled the order' },
        { requestor: UserTypes.Customer, receiver: UserTypes.Provider },
      );

      const provider = await getProvider({ searchValue: order?.providerUserId, searchKey: 'userId' });

      if (order) {
        socketLogger.debug('[SOCKET] Order found ', order.orderId);

        socket.to(order.providerUuid).emit('notify-order-remove', {
          ...order,
        });

        if (provider)
          sendNotification({
            data: {},
            description: 'Order rejected by customer',
            title: 'Unfortunatly, Customer have rejected the order',
            expoToken: provider?.notifcationToken || '',
          });

        cancelOnHoldPayment(order);

        // Below fallback if order is not found for any reason. Remove active order from provider so we don't block provider
      }
      if (provider?.userId) {
        const updatedProvider = await updateProvider({
          newValues: { status: ProviderStatus.Online },
          searchValue: provider?.userId,
          searchKey: 'userId',
          socket,
        });

        if (updatedProvider && order) {
          socketLogger.debug('[SOCKET] Notifying provider about order removal', { provider, order });
          socket.to(provider?.uuid || '').emit('notify-active-order-remove', {
            ...order,
            customerUuid: socket?.id,
            providerUuid: updatedProvider?.uuid,
            providerUserId: updatedProvider?.userId,
          });
        }
      }
    });

    socket.on('provider-arrived', async (args) => {
      //Get order
      const order = await updateOrder(
        { newValues: { orderStep: OrderStep.inProgressArrived2 }, searchValue: args.orderId, socket },
        { reason: OrderHistory.ProviderArrived, notes: 'Provider has arrived at the location' },
      );

      if (order) {
        sendNotification({
          data: {},
          description: 'Provider arrived',
          title: 'Provider have confirmed that he have arrived to your car !',
          expoToken: order?.customerNotificationToken,
        });

        // Notify customer
        socket
          .to(order.customerUuid)
          .emit('provider-to-customer-arrived', { orderId: args.orderId, orderStep: OrderStep.inProgressArrived2 });

        // Send system message to order chat
        try {
          await sendSystemMessage(args.orderId, 'Provider has arrived at your location!');
        } catch (error: any) {
          logger.error('Failed to send system message on provider arrival:', {
            orderId: args.orderId,
            error: error.message,
          });
          socketLogger.error('[SOCKET] Failed to send system message:', error.message);
        }
      }
    });

    socket.on('provider-finished-order', async (args) => {
      const order = await removeOrder(
        { searchValue: args.orderId, socket },
        { reason: OrderHistory.ServiceFinished, notes: 'Provider has finished the service' },
        {
          requestor: UserTypes.Provider,
          receiver: UserTypes.Customer,
        },
      );

      if (order) {
        const provider = await updateProvider({
          newValues: { status: ProviderStatus.Online },
          searchValue: order.providerUuid,
          searchKey: 'uuid',
          socket,
        });

        if (provider) {
          socketLogger.debug('Sending update to customer', { provider, order });

          sendNotification({
            data: {},
            description: 'Order finished',
            title: 'Customer have confirmed that order is finished',
            expoToken: provider?.notifcationToken,
          });

          sendNotification({
            data: {},
            description: 'Order finished',
            title: 'Order finished ! Thank you for using our services',
            expoToken: order?.customerNotificationToken,
          });

          capturePayment(order);

          // Clear cache for provider services after successful upsert
          // This clears cache only for the specific provider's cached entries

          clearCacheByProviderId(provider.providerId, 'revenue');

          // Send system message to order chat
          try {
            await sendSystemMessage(order.orderId, 'Service completed successfully! Thank you for using our services.');
          } catch (error: any) {
            logger.error('Failed to send system message on order completion:', {
              orderId: order.orderId,
              error: error.message,
            });
            socketLogger.error('[SOCKET] Failed to send system message:', error.message);
          }

          broadcasterHelper(
            socket,
            'provider-to-customer-finished-confirmation',
            { ...args, result: true },
            { receiver: UserTypes.Customer, requestor: UserTypes.Provider },
            order.customerUuid,
          );
        }
      }
    });
  } catch (error: any) {
    logger.error('Socket connection handler error:', {
      socketId: socket.id,
      error: error.message,
      stack: error.stack,
    });
    socketLogger.error('[SOCKET] Connection handler error:', error.message);
  }
});

// #endregion
export default io;

// #region Functions for unit testing ONLY
export const resetVars = async () => {
  // Clear Redis data
  await SocketRedisManager.clearAll();

  // Clear legacy in-memory arrays
  onlineProviders = [];
  activeOrders = [];
  autoSelectContexts.clear();
};
export const getOnlineProvider = () => {
  return onlineProviders;
};

// Sync legacy arrays with Redis data (for debugging/monitoring)
export const syncLegacyArrays = async () => {
  onlineProviders = await SocketRedisManager.getAllProviders();
  activeOrders = await SocketRedisManager.getAllOrders();
  return {
    onlineProviders: onlineProviders.length,
    activeOrders: activeOrders.length,
  };
};
export const setOrderTimeout = (seconds: number) => {
  ORDER_TIMEOUT_SECONDS = seconds;
};
// #endregion

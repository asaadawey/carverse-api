/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import redisAdapter from '@socket.io/redis-adapter';
import _ from 'lodash';
import prismaClient from '@src/helpers/databaseHelpers/client';
import { OrderHistory, UserTypes } from '../interfaces/enums';
import schedule from 'node-schedule';
import { addSeconds } from 'date-fns';
import envVars, { isTest } from '@src/config/environment';
import apiAuthMiddleware from '@src/middleware/apiAuth.middleware';
import sendNotification from '@src/utils/sendNotification';
import { cancelOnHoldPayment, capturePayment } from '@src/utils/payment';
import corsOptions from '@src/utils/cors';
import { Redis } from 'ioredis';

//#region Enums & Interfaces
export enum ProviderStatus {
  Online = 'Online',
  Offline = 'Offline',
  HaveOrder = 'Have order',
}

enum OrderStep {
  stillNotAcceptedByProvider1,
  inProgressNotArrived2,
  inProgressArrived3,
  providerFinishedAndTakePictures4,
  awaitingCustomerAcceptance5,
  finished6,
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

export type OrderDetails = { orderId: number; orderStep: OrderStep };

export type ActiveOrders = OrderDetails & {
  providerUuid: string;
  customerUuid: string;
  customerUserId: number;
  providerUserId: number;
  customerNotificationToken: string;
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
) => T | undefined;

type UpdateService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: CommonForAllService<T> & {
    newValues: Partial<T>;
  },
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => T | undefined;

type AddService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: { socket: CustomSocket; newArgs: T },
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => boolean;

type RemoveService<T, TSecondArg = undefined, THirdArg = undefined> = (
  args: CommonForAllService<T>,
  arg2?: TSecondArg,
  arg3?: THirdArg,
) => T | undefined;

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
  'order-timeout': () => void;
  'provider-to-customer-location-change': (data: {
    longitude: number;
    latitude: number;
    providerId: number;
    userId: number;
  }) => void;
  'provider-to-customer-arrived': (data: OrderDetails) => void;
  'customer-to-provider-finished-order': (data: OrderDetails & Result) => void;
  'provider-to-customer-finished-confirmation': (data: OrderDetails) => void;
  disconnect: any;
  'notify-active-session': (args: ActiveSession) => void;
}

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
    orderId: number;
    customerUuid: string;
    customrUserId: number;
    providerId: number;
    userId: number;
    customerNotificationToken: string;
  }) => void;
  'all-online-providers': (moduleId: number) => void;
  'provider-accept-order': (data: { orderId: number; customerUuid: string }) => void;
  'provider-reject-order': (data: { orderId: number; customerUuid: string }) => void;
  'customer-reject-inprogress-order': (data: { orderId: number; providerId: number }) => void;
  'provider-finished-order': (data: OrderDetails) => void;
  'customer-confirms-finished-order': (data: OrderDetails & Result) => void;
  'force-check-active-session': (user: UserInfo) => void;
  disconnect: any;
  connect: any;
}
//#endregion

const ORDER_TIMEOUT_SECONDS = Number(envVars.order.timeout);
// const ORDER_TIMEOUT_SECONDS = Number(300);
type SocketData = {
  userInfo: UserInfo;
};

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const pubClient = new Redis({
  port: envVars.redis.port,
  host: envVars.redis.host,
  username: envVars.redis.username,
  password: envVars.redis.password,
});
const subClient = pubClient.duplicate();

const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>({
  cors: corsOptions,
  adapter: !isTest ? redisAdapter.createAdapter(pubClient, subClient) : undefined,
});

export let onlineProviders: ProviderSocket[] = [];
export let activeOrders: ActiveOrders[] = [];

//#region Functions
const broadcasterHelper = (
  socket: CustomSocket,
  event: keyof ServerToClientEvents,
  payload: any,
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

export const addOrderHistory = async (order: ActiveOrders, reason: OrderHistory) => {
  const prisma = prismaClient;
  console.log(
    '[SOCKET - Add order history] Add order history, Order ID : ' + order.orderId + ' Reason : ' + reason.toString(),
  );
  await prisma.orderHistory.create({
    data: {
      orders: { connect: { id: order.orderId } },
      orderHistoryItems: { connect: { HistoryName: reason } },
    },
  });
};

export const broadcastOnlineProvider = (socket: CustomSocket, moduleId?: number) => {
  const filteredProviders = onlineProviders.filter(
    (provider) => provider.status === ProviderStatus.Online && (moduleId ? provider.moduleId === moduleId : true),
  );
  console.log(
    '[SOCKET - Broadcast online providers] Broadcasting online providers, Total Online Providers : ' +
      filteredProviders.length,
  );
  socket.broadcast.emit('online-users', filteredProviders);
  socket.emit('online-users', filteredProviders);
};

export const checkActiveSession = (socket: CustomSocket, user: UserInfo | undefined) => {
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
  const order = getOrder({ searchKey: toSearchKey, searchValue: user?.id || '' });

  // Update the current providers and orders
  if (user?.UserTypeName === 'Customer' && order) {
    let newOrders = activeOrders.filter((aOrder) => aOrder.orderId !== order.orderId);
    activeOrders = [...newOrders, { ...order, customerUuid: socket.id }];
  }

  if (order) {
    console.log('[SOCKET] Restoring active session ', { order, user });
    const provider = getProvider({
      searchKey: 'uuid',
      searchValue: order.providerUuid,
    });
    // Update providerUuid
    //Update providerUuid;

    if (provider) {
      updateProvider({ newValues: { ...provider, uuid: socket.id }, socket, searchValue: provider.userId });

      broadcasterHelper(
        socket,
        'provider-online-finish',
        { result: true },
        { requestor: UserTypes.Provider, receiver: UserTypes.Provider },
      );

      socket.join('providers');

      updateOrder({ socket, newValues: { providerUuid: socket.id }, searchValue: order.orderId });

      broadcasterHelper(
        socket,
        'notify-active-session',
        { type: user?.UserTypeName?.toLowerCase?.() as any, order: { ...order, moduleId: provider.moduleId } },
        { requestor: UserTypes.Provider, receiver: UserTypes.Provider },
      );
    }
  }
};

// #region Providers

const defaultProviderSearchKey: keyof ProviderSocket = 'userId';

export const addProvider: AddService<ProviderSocket> = ({ newArgs, socket }) => {
  if (!newArgs.uuid) newArgs.uuid = socket.id;

  console.log('[SOCKET] [Provider] [Add] => Adding new provdider ' + JSON.stringify({ newArgs }));

  onlineProviders = [...onlineProviders.filter((p) => p[defaultOrderSearchKey] !== newArgs.userId), { ...newArgs }];

  broadcastOnlineProvider(socket);

  socket.emit('provider-online-finish', { result: true });

  socket.join('providers');

  return true;
};

export const updateProvider: UpdateService<ProviderSocket, boolean> = (
  { newValues, searchKey = defaultProviderSearchKey, searchValue, socket },
  skipBroadcast = false,
) => {
  console.log(
    '[SOCKET] [Provider] [Update] => Update provider ' + JSON.stringify({ newValues, searchKey, searchValue }),
  );

  const provider = getProvider({ searchKey, searchValue });

  if (provider) {
    onlineProviders = [
      ...onlineProviders.filter((p) => p[searchKey] !== searchValue),
      {
        ...provider,
        ...newValues,
      },
    ];
  }

  if (!skipBroadcast) broadcastOnlineProvider(socket);

  return provider ? { ...provider, ...newValues } : undefined;
};

export const removeProvider: RemoveService<ProviderSocket, boolean> = (
  { searchKey = defaultProviderSearchKey, searchValue, socket },
  skipBroadcast = false,
) => {
  console.log('[SOCKET] [Provider] [Remove] => Remove provider ' + JSON.stringify({ searchKey, searchValue }));

  const toDeleteProvider = onlineProviders.find((p) => p[searchKey] === searchValue);

  onlineProviders = onlineProviders.filter((p) => p[searchKey] !== searchValue);

  if (!skipBroadcast) broadcastOnlineProvider(socket);

  socket.emit('provider-offline-finish', { result: true });

  socket.leave('providers');

  return toDeleteProvider;
};

export const getProvider: GetService<ProviderSocket> = ({ searchKey = defaultProviderSearchKey, searchValue }) => {
  const provider = onlineProviders.find((provider) => provider[String(searchKey)] === searchValue) as ProviderSocket;
  return provider;
};
// #endregion

// #region Orders
const defaultOrderSearchKey: keyof ActiveOrders = 'orderId';

export const addOrder: AddService<ActiveOrders, BroadcastHelperArgs> = ({ newArgs, socket }, broadcastArgs) => {
  console.log('[SOCKET] [Order] [Add] => Adding new Order ' + JSON.stringify({ newArgs }));

  activeOrders = [...activeOrders.filter((p) => p[defaultOrderSearchKey] !== newArgs.orderId), { ...newArgs }];

  if (broadcastArgs) broadcasterHelper(socket, 'notify-order-add', { ...newArgs }, broadcastArgs, newArgs.providerUuid);

  return true;
};

export const updateOrder: UpdateService<ActiveOrders, OrderHistory> = (
  { newValues, searchValue, searchKey = defaultOrderSearchKey },
  reason,
) => {
  console.log('[SOCKET] [Order] [Update] => Update Order ' + JSON.stringify({ newValues, searchKey, searchValue }));

  const order = getOrder({ searchKey, searchValue });

  if (order) {
    const newOrder = {
      ...order,
      ...newValues,
    };

    activeOrders = [...activeOrders.filter((p) => p[searchKey] !== searchValue), newOrder];

    if (reason) addOrderHistory(newOrder, reason);
  }

  return order ? { ...order, ...newValues } : undefined;
};

export const removeOrder: RemoveService<ActiveOrders, OrderHistory, BroadcastHelperArgs> = (
  { searchValue, socket, searchKey = defaultOrderSearchKey },
  reason,
  broadcastArgs,
) => {
  console.log('[SOCKET] [Order] [Remove] => Remove Order ' + JSON.stringify({ searchKey, searchValue }));

  const toDeleteOrder = activeOrders.find((p) => p[searchKey] === searchValue);

  activeOrders = activeOrders.filter((p) => p[searchKey] !== searchValue);

  if (reason && toDeleteOrder && broadcastArgs) {
    addOrderHistory(toDeleteOrder, reason);

    broadcasterHelper(socket, 'notify-order-remove', { ...toDeleteOrder }, broadcastArgs, toDeleteOrder.providerUuid);

    if (toDeleteOrder.orderStep !== OrderStep.stillNotAcceptedByProvider1)
      broadcasterHelper(
        socket,
        'notify-active-order-remove',
        { ...toDeleteOrder },
        broadcastArgs,
        toDeleteOrder.providerUuid,
      );
  }

  return toDeleteOrder;
};

export const getOrder: GetService<ActiveOrders> = ({ searchValue, searchKey = defaultOrderSearchKey }) => {
  const order = activeOrders.find((order) => order[String(searchKey)] === searchValue) as ActiveOrders;
  return order;
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
    console.log('Connected');
    next();
  } catch (error: any) {
    console.log('Socket Error : ' + { error });
    next(error);
  }
});
// #endregion

io.on('connect', (socket) => {
  const user = socket.data.userInfo;
  console.log('user', user);

  checkActiveSession(socket, user);
});

io.on('connection', (socket) => {
  // socket.on('connect', () => {
  //   //@ts-ignore
  //   console.log("user", socket.userId)
  // })
  socket.on('force-check-active-session', (user) => {
    checkActiveSession(socket, user);
  });

  socket.on('provider-online-start', (args) => {
    if ((!socket.id && !args.uuid) || !args.userId || !args.providerId) {
      console.log('No enough args ', { args });
      socket.emit('provider-online-finish', { result: false });
      return;
    }

    let orderFound = false;
    // Check if provider is already online0
    const online = getProvider({ searchKey: 'providerId', searchValue: args.providerId });
    if (online) {
      // Check if provider has active order
      const order = getOrder({ searchValue: online.uuid, searchKey: 'providerUuid' });
      if (order) {
        orderFound = true;

        checkActiveSession(socket, { id: online.userId, UserTypeName: 'Provider' });
        return;
      }
    }

    if (online) {
      // if provider has active order. Then switch to the new client.
      updateProvider({
        socket,
        newValues: { uuid: socket.id, status: orderFound ? ProviderStatus.HaveOrder : ProviderStatus.Online },
        searchValue: online.userId,
      });
      socket.emit('provider-online-finish', { result: true });
    } else addProvider({ socket, newArgs: { ...args } });
  });

  socket.on('provider-offline-start', (args) => {
    removeProvider({ searchValue: socket.id, searchKey: 'uuid', socket });
  });

  socket.on('provider-online-location-change', (args) => {
    // let provider = getProvider({ searchValue: args.userId });

    const provider = updateProvider({ socket, newValues: { ...args }, searchValue: args.userId }, true);

    const order = getOrder({ searchValue: socket.id, searchKey: 'providerUuid' });

    console.log('Provider location change', order);
    //Provider have an active order;
    if (order && provider) {
      console.log('Order found');

      socket.to(order.customerUuid).emit('provider-to-customer-location-change', {
        latitude: args.latitude,
        longitude: args.longitude,
        providerId: provider.providerId,
        userId: provider.userId,
      });
    } else console.log('ERROR ORDER NOT FOUND');
  });

  socket.on('new-order', (args) => {
    const selectedProvider = getProvider({ searchKey: 'providerId', searchValue: args.providerId });

    if (!selectedProvider) {
      cancelOnHoldPayment(args.orderId);
      socket.emit('order-timeout');
      return;
    }

    // Check if customer have any in progress order
    const currentCustomerOrder = getOrder({ searchValue: args.customrUserId, searchKey: 'customerUserId' });
    if (currentCustomerOrder) {
      socket.emit('order-rejected', {
        message: 'You have an existing active order.',
        result: false,
        orderId: currentCustomerOrder.orderId,
        orderStep: currentCustomerOrder.orderStep,
      });
      return;
    }

    addOrder(
      {
        socket,
        newArgs: {
          customerUuid: args.customerUuid,
          orderId: args.orderId,
          customerUserId: args.customrUserId,
          customerNotificationToken: args.customerNotificationToken,
          providerUserId: selectedProvider.userId,
          providerUuid: selectedProvider?.uuid,
          orderStep: OrderStep.stillNotAcceptedByProvider1,
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
    schedule.scheduleJob(timeOutDate, async function () {
      const selectedProviderTimeout = getProvider({ searchKey: 'providerId', searchValue: args.providerId });
      // Check if the provider has job so cancel timout
      if (selectedProviderTimeout && selectedProviderTimeout?.status !== ProviderStatus.HaveOrder) {
        socket.emit('order-timeout');

        removeOrder({ searchValue: args.orderId, socket }, OrderHistory.Timeout, {
          receiver: UserTypes.Provider,
          requestor: UserTypes.Customer,
        });

        cancelOnHoldPayment(args.orderId);
      }
    });
  });

  socket.on('all-online-providers', (moduleId) => {
    broadcastOnlineProvider(socket, moduleId);
  });

  socket.on('provider-accept-order', async (args) => {
    const order = getOrder({ searchValue: args.orderId });

    if (order) {
      console.log('[SOCKET] Order found , OrderID : ' + order.orderId);

      const updatedOrder = updateOrder(
        { newValues: { orderStep: OrderStep.inProgressNotArrived2 }, searchValue: args.orderId, socket },
        OrderHistory.Accepted,
      );
      // Set provider status to have order
      const provider = updateProvider({
        newValues: { status: ProviderStatus.HaveOrder },
        searchValue: order.providerUuid,
        socket,
        searchKey: 'uuid',
      });

      if (updatedOrder && provider) {
        socket.to(args.customerUuid).emit('order-accepted', {
          result: true,
          orderId: updatedOrder.orderId,
          providerId: provider.providerId,
          userId: provider.userId,
          orderStep: updatedOrder.orderStep,
          message: '',
        });

        sendNotification({
          data: {},
          description: 'Order accepted',
          title: 'Your provider on his way',
          expoToken: updatedOrder.customerNotificationToken,
        });

        socket.emit('set-active-order', { orderId: updatedOrder.orderId, orderStep: OrderStep.inProgressNotArrived2 });

        // Add this emit to send the customer current provider location

        socket.to(args.customerUuid).emit('provider-to-customer-location-change', {
          ...provider,
        });
      }
    }
  });

  socket.on('provider-reject-order', async (args) => {
    const order = removeOrder({ searchValue: args.orderId, socket }, OrderHistory.Rejected, {
      requestor: UserTypes.Provider,
      receiver: UserTypes.Provider,
    });

    if (order) {
      sendNotification({
        data: {},
        description: 'Order Rejected',
        title: 'Unfortunatly, Provider have rejected the order. You can choose other provider',
        expoToken: order?.customerNotificationToken,
      });

      cancelOnHoldPayment(args.orderId);

      socket.to(args.customerUuid).emit('order-rejected', {
        result: false,
        orderId: args.orderId,
        orderStep: OrderStep.stillNotAcceptedByProvider1,
      });
    }
  });

  socket.on('customer-reject-inprogress-order', async (args) => {
    const order = removeOrder(
      { searchValue: args.orderId, searchKey: 'orderId', socket },
      OrderHistory.CustomerCancelled,
      { requestor: UserTypes.Customer, receiver: UserTypes.Provider },
    );

    if (order) {
      console.log('[SOCKET] Order found ', order.orderId);

      const provider = getProvider({ searchValue: args.providerId, searchKey: 'providerId' });

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

      cancelOnHoldPayment(order.orderId);

      // Below fallback if order is not found for any reason. Remove active order from provider so we don't block provider
    }
    if (args.providerId) {
      const provider = updateProvider({
        newValues: { status: ProviderStatus.Online },
        searchValue: args.providerId,
        searchKey: 'providerId',
        socket,
      });

      if (provider && order)
        socket.to(provider?.uuid || '').emit('notify-active-order-remove', {
          ...order,
          customerUuid: socket?.id,
          providerUuid: provider?.uuid,
          providerUserId: provider?.userId,
        });
    }
  });

  socket.on('provider-arrived', async (args) => {
    //Get order
    const order = updateOrder(
      { newValues: { orderStep: OrderStep.inProgressArrived3 }, searchValue: args.orderId, socket },
      OrderHistory.ProviderArrived,
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
        .emit('provider-to-customer-arrived', { orderId: args.orderId, orderStep: OrderStep.inProgressArrived3 });
    }
  });

  socket.on('provider-finished-order', (args) => {
    const order = removeOrder({ searchValue: args.orderId, socket }, OrderHistory.ServiceFinished, {
      requestor: UserTypes.Provider,
      receiver: UserTypes.Customer,
    });

    if (order) {
      const provider = updateProvider({
        newValues: { status: ProviderStatus.Online },
        searchValue: order.providerUuid,
        searchKey: 'uuid',
        socket,
      });

      if (provider) {
        console.log('Sending update to customer', { provider, order });

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

        capturePayment(order.orderId);

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
});

export default io;

// #region Functions for unit testing ONLY
export const resetVars = () => {
  onlineProviders = [];
  activeOrders = [];
};
export const getOnlineProvider = () => {
  return onlineProviders;
};
// #endregion

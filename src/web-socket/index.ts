/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import * as _ from 'lodash';
import prismaClient from 'src/helpers/databaseHelpers/client';
import { OrderHistory } from '../interfaces/enums';
import schedule from 'node-schedule';
import { addSeconds } from 'date-fns';
import envVars from 'src/config/environment';
import apiAuthMiddleware from 'src/middleware/apiAuth.middleware';
import sendNotification from 'src/utils/sendNotification';

//#region Enums & Interfaces
export enum ProviderStatus {
  Online = 'Online',
  Offline = 'Offline',
  HaveOrder = 'Have order',
}

export type ProviderSocket = {
  userId: number;
  providerId: number;
  longitude: number;
  latitude: number;
  uuid: string;
  status: ProviderStatus;
  notifcationToken: string;
};

export type OrderDetails = { orderId: number };

export type ActiveOrders = OrderDetails & {
  providerUuid: string;
  customerUuid: string;
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
    providerId: number;
    userId: number;
    customerNotificationToken: string;
  }) => void;
  'all-online-providers': () => void;
  'provider-accept-order': (data: { orderId: number; customerUuid: string }) => void;
  'provider-reject-order': (data: { orderId: number; customerUuid: string }) => void;
  'customer-reject-inprogress-order': (data: { orderId: number; providerId: number }) => void;
  'provider-finished-order': (data: OrderDetails) => void;
  'customer-confirms-finished-order': (data: OrderDetails & Result) => void;
  disconnect: any;
}
//#endregion

const ORDER_TIMEOUT_SECONDS = Number(envVars.order.timeout);
// const ORDER_TIMEOUT_SECONDS = Number(300);

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: { origin: '*' },
});

const prisma = prismaClient;

let onlineProviders: ProviderSocket[] = [];
let activeOrders: ActiveOrders[] = [];

//#region Functions
export const addOrderHistory = async (orderId: number, reason: OrderHistory) => {
  console.log(
    '[SOCKET - Add order history] Add order history, Order ID : ' + orderId + ' Reason : ' + reason.toString(),
  );
  await prisma.orderHistory.create({
    data: {
      orders: { connect: { id: orderId } },
      orderHistoryItems: { connect: { HistoryName: reason } },
    },
  });
};

export const broadcastOnlineProvider = (socket: CustomSocket) => {
  const filteredProviders = onlineProviders.filter((provider) => provider.status === ProviderStatus.Online);
  console.log(
    '[SOCKET - Broadcast online providers] Broadcasting online providers, Total Online Providers : ' +
      filteredProviders.length,
  );
  socket.broadcast.emit('online-users', filteredProviders);
  socket.emit('online-users', filteredProviders);
};

export const addUpdateOnlineProvider = (
  { userId, providerId, longitude, latitude, uuid, notifcationToken, status }: ProviderSocket,
  socket: CustomSocket,
  isUpdate?: true,
) => {
  console.log('[SOCKET - Add/Update providers] Updating online providers, Provider User ID : ' + userId);
  console.log('[SOCKET - Add/Update providers] Received new statuss ' + status);
  const provider = onlineProviders.find((provider) => provider.userId === userId);
  if ((provider && isUpdate) || !isUpdate) {
    const filteredOnlineProviders = onlineProviders.filter((provider) => provider.userId !== userId);
    onlineProviders = _.uniqBy(
      [
        ...filteredOnlineProviders,
        {
          userId,
          providerId,
          longitude,
          latitude,
          uuid,
          notifcationToken,
          status,
        },
      ],
      (a) => a.userId,
    );
    console.log('[SOCKET - Add/Update providers] New online providers : ', onlineProviders);

    broadcastOnlineProvider(socket);

    if (!isUpdate) {
      socket.emit('provider-online-finish', { result: true });
      socket.join('providers');
    }
  }
};

export const removeOnlineProvider = (id: number, socket: CustomSocket) => {
  console.log('[SOCKET - Remove online provider] Provider went offline, Provider ID : ' + id);
  onlineProviders = onlineProviders.filter((provider) => provider.userId !== id);
  broadcastOnlineProvider(socket);
  socket.emit('provider-offline-finish', { result: true });
  socket.leave('providers');
};

export const getActiveOrders = (id: any, searchKey: keyof ActiveOrders = 'orderId') => {
  const order = activeOrders.find((order) => order[searchKey] === id) as ActiveOrders;
  return order;
};

export const addPendingOrder = (
  { customerUuid, orderId, providerUuid, customerNotificationToken: customerNotificationUuid }: ActiveOrders,
  socket: CustomSocket,
) => {
  console.log('[SOCKET - Add new order] Adding new order. OrderID : ' + orderId + ' ProviderUuid : ' + providerUuid);
  activeOrders = _.uniqBy(
    [
      ...activeOrders,
      {
        providerUuid,
        customerUuid,
        orderId,
        customerNotificationToken: customerNotificationUuid,
      },
    ],
    (a) => a.orderId,
  );
  socket.to(providerUuid).emit('notify-order-add', {
    providerUuid,
    customerUuid,
    orderId,
    customerNotificationToken: customerNotificationUuid,
  });
};

export const removePendingOrder = async (
  orderId: number,
  socket: CustomSocket,
  reason: OrderHistory,
  {
    ignoreArrayRemove,
    ignoreNotifyOrderRemove,
    isOrderActive,
  }: {
    isOrderActive?: boolean;
    ignoreNotifyOrderRemove?: boolean;
    ignoreArrayRemove?: boolean;
  } = {},
) => {
  const order = getActiveOrders(orderId);
  if (order) {
    if (!ignoreArrayRemove) activeOrders = activeOrders.filter((order) => order.orderId !== orderId);

    await addOrderHistory(orderId, reason);

    console.log(
      '[SOCKET - Remove new order] Remove pending order. OrderID : ' +
        orderId +
        ' Reason : ' +
        reason.toString() +
        ' Provider Uuid : ' +
        order?.providerUuid +
        ' New pending orders : ' +
        activeOrders,
    );
    if (isOrderActive) {
      socket.to(order?.providerUuid || '').emit('notify-active-order-remove', {
        ...order,
      });
    } else {
      if (!ignoreNotifyOrderRemove) {
        // Explicit case if order is rejected
        if (reason === OrderHistory.Rejected) {
          socket.emit('notify-order-remove', {
            customerUuid: order.customerUuid,
            orderId,
            providerUuid: order.providerUuid,
            customerNotificationToken: order.customerNotificationToken,
          });
        } else {
          socket.to(order.providerUuid).emit('notify-order-remove', {
            customerUuid: order.customerUuid,
            orderId,
            providerUuid: order.providerUuid,
            customerNotificationToken: order.customerNotificationToken,
          });
        }
      }
    }
  }
};

export const getOnlineProvider = (id: any, searchKey: keyof ProviderSocket = 'userId') => {
  const provider = onlineProviders.find((provider) => provider[searchKey] === id) as ProviderSocket;
  return provider;
};

export const setProviderOffline = (providerId: number, socket: CustomSocket) => {
  const providerOrders = activeOrders.filter((order) => order.providerUuid === socket.id);
  providerOrders.forEach((order) => {
    socket.to(order.customerUuid).emit('order-rejected', {
      result: false,
      orderId: order.orderId,
      message: "Provider wen't offline",
    });
  });
  removeOnlineProvider(providerId, socket);
};
//#endregion

// #region IO Auth
io.use((socket, next) => {
  try {
    const apiValue = socket.handshake.auth[envVars.auth.apiKey];
    apiAuthMiddleware(apiValue);
    next();
  } catch (error: any) {
    next(error);
  }
});
// #endregion

io.on('connection', (socket) => {
  socket.on('provider-online-start', (args) => {
    if ((!socket.id && !args.uuid) || !args.userId || !args.providerId) {
      socket.emit('provider-online-finish', { result: false });
      return;
    }

    addUpdateOnlineProvider(
      {
        userId: args.userId,
        providerId: args.providerId,
        latitude: args.latitude,
        longitude: args.longitude,
        notifcationToken: args.notifcationToken,
        uuid: socket.id,
        status: ProviderStatus.Online,
      },
      socket,
    );
  });

  socket.on('provider-offline-start', (args) => {
    setProviderOffline(args.id, socket);
  });

  socket.on('provider-online-location-change', (args) => {
    let provider = getOnlineProvider(args.userId);

    provider = { ...provider, ...args };

    addUpdateOnlineProvider({ ...provider }, socket, true);

    const order = getActiveOrders(provider.uuid, 'providerUuid');
    console.log('Provider location change', order);
    //Provider have an active order;
    if (order) {
      console.log('Order found');
      socket.to(order.customerUuid).emit('provider-to-customer-location-change', {
        latitude: args.latitude,
        longitude: args.longitude,
        providerId: provider.providerId,
        userId: provider.userId,
      });
    }
  });

  socket.on('new-order', (args) => {
    const selectedProvider = getOnlineProvider(args.providerId, 'providerId');

    if (!selectedProvider) {
      socket.emit('order-timeout');
      return;
    }

    addPendingOrder(
      {
        customerUuid: args.customerUuid,
        orderId: args.orderId,
        providerUuid: selectedProvider?.uuid,
        customerNotificationToken: args.customerNotificationToken,
      },
      socket,
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
      const selectedProviderTimeout = getOnlineProvider(args.providerId, 'providerId');
      // Check if the provider has job so cancel timout
      if (selectedProviderTimeout && selectedProviderTimeout?.status !== ProviderStatus.HaveOrder) {
        socket.emit('order-timeout');

        await removePendingOrder(args.orderId, socket, OrderHistory.Timeout, { isOrderActive: false });
      }
    });
  });

  socket.on('all-online-providers', () => {
    broadcastOnlineProvider(socket);
  });

  socket.on('provider-accept-order', async (args) => {
    const order = getActiveOrders(args.orderId);

    if (order) {
      console.log('[SOCKET] Order found , OrderID : ' + order.orderId);
      await removePendingOrder(args.orderId, socket, OrderHistory.Accepted, {
        ignoreNotifyOrderRemove: true,
        ignoreArrayRemove: true,
      });

      const provider = getOnlineProvider(order.providerUuid, 'uuid');

      addUpdateOnlineProvider({ ...provider, status: ProviderStatus.HaveOrder }, socket, true);

      socket.to(args.customerUuid).emit('order-accepted', {
        result: true,
        orderId: args.orderId,
        providerId: provider.providerId,
        userId: provider.userId,
      });

      sendNotification({
        data: {},
        description: 'Order accepted',
        title: 'Your provider on his way',
        expoToken: order.customerNotificationToken,
      });

      socket.emit('set-active-order', { orderId: args.orderId });

      // Add this emit to send the customer current provider location

      socket.to(args.customerUuid).emit('provider-to-customer-location-change', {
        ...provider,
      });
    }
  });

  socket.on('provider-reject-order', async (args) => {
    await removePendingOrder(args.orderId, socket, OrderHistory.Rejected);
    const order = getActiveOrders(args.orderId, 'orderId');
    sendNotification({
      data: {},
      description: 'Order Rejected',
      title: 'Unfortunatly, Provider have rejected the order. You can choose other provider',
      expoToken: order?.customerNotificationToken,
    });

    socket.to(args.customerUuid).emit('order-rejected', { result: false, orderId: args.orderId });
  });

  socket.on('customer-reject-inprogress-order', async (args) => {
    const order = getActiveOrders(args?.orderId, 'orderId');

    const provider = getOnlineProvider(args.providerId, 'providerId');

    if (order) {
      console.log('[SOCKET] Order found ', order.orderId);

      await removePendingOrder(args.orderId, socket, OrderHistory.CustomerCancelled, {
        isOrderActive: true,
      });

      socket.to(order.providerUuid).emit('notify-order-remove', {
        customerUuid: order.customerUuid,
        orderId: order.orderId,
        providerUuid: order.providerUuid,
        customerNotificationToken: order.customerNotificationToken,
      });

      sendNotification({
        data: {},
        description: 'Order rejected by customer',
        title: 'Unfortunatly, Customer have rejected the order',
        expoToken: provider.notifcationToken,
      });

      // Below fallback if order is not found for any reason. Remove active order from provider so we don't block provider
    }
    if (args.providerId) {
      addUpdateOnlineProvider({ ...provider, status: ProviderStatus.Online }, socket, true);

      socket.to(provider?.uuid || '').emit('notify-active-order-remove', {
        customerUuid: socket?.id,
        orderId: order?.orderId,
        providerUuid: provider?.uuid,
        customerNotificationToken: order?.customerNotificationToken,
      });
    }
  });

  socket.on('provider-arrived', async (args) => {
    //Get order
    const order = getActiveOrders(args.orderId);

    const provider = getOnlineProvider(order.providerUuid, 'uuid');

    if (order && provider) {
      // Should check if provider arrived within radius

      // Append to order history
      await addOrderHistory(order.orderId, OrderHistory.ProviderArrived);

      sendNotification({
        data: {},
        description: 'Provider arrived',
        title: 'Provider have confirmed that he have arrived to your car !',
        expoToken: order.customerNotificationToken,
      });

      // Notify customer
      socket.to(order.customerUuid).emit('provider-to-customer-arrived', { orderId: args.orderId });
    }
  });

  socket.on('provider-finished-order', (args) => {
    const order = getActiveOrders(args.orderId, 'orderId');

    if (order) {
      const provider = getOnlineProvider(order.providerUuid, 'uuid');

      if (provider) {
        sendNotification({
          data: {},
          description: 'Provider finsihed order',
          title: 'Provider have finished your order. Please confirm by clicking here !',
          expoToken: order.customerNotificationToken,
        });

        socket.to(order.customerUuid).emit('provider-to-customer-finished-confirmation', args);
      }
    }
  });

  socket.on('customer-confirms-finished-order', async (args) => {
    const order = getActiveOrders(args.orderId, 'orderId');

    if (order) {
      const provider = getOnlineProvider(order.providerUuid, 'uuid');

      if (provider) {
        if (args.result) {
          await removePendingOrder(args.orderId, socket, OrderHistory.ServiceFinished, {
            isOrderActive: true,
          });

          sendNotification({
            data: {},
            description: 'Order finished',
            title: 'Customer have confirmed that order is finished',
            expoToken: provider.notifcationToken,
          });
        }

        socket.to(order.providerUuid).emit('customer-to-provider-finished-order', args);

        socket.emit('provider-to-customer-finished-confirmation', { orderId: args.orderId });
      }
    }
  });

  socket.on('disconnect', async () => {
    const provider = getOnlineProvider(socket.id, 'uuid');
    if (provider) {
      // Check if provider have any active order
      const order = getActiveOrders(provider.uuid, 'providerUuid');
      if (order) {
        await removePendingOrder(order.orderId, socket, OrderHistory.Cancelled, { isOrderActive: true });

        socket.to(order.customerUuid).emit('provider-offline-finish', { result: true });
      }
      setProviderOffline(provider.userId, socket);
    }
    // For any reasons if customer logged out
    const order = getActiveOrders(socket.id, 'customerUuid');
    if (order) {
      await removePendingOrder(order.orderId, socket, OrderHistory.Cancelled, { isOrderActive: true });

      socket.to(order.providerUuid).emit('notify-active-order-remove', order);
    }
  });
});

export default io;

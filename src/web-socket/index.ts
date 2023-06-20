/* eslint-disable no-console */
import { Server, Socket } from 'socket.io';
import * as _ from 'lodash';
import prismaClient from 'helpers/databaseHelpers/client';
import { OrderHistory } from '../interfaces/enums';
import schedule from 'node-schedule';
import { addSeconds } from 'date-fns';
import envVars from 'config/environment';
import apiAuthMiddleware from 'middleware/apiAuth.middleware';

//#region Enums & Interfaces
enum ProviderStatus {
  Online = 'Online',
  Offline = 'Offline',
  HaveOrder = 'Have order',
}

type ProviderSocket = {
  userId: number;
  providerId: number;
  longitude: number;
  latitude: number;
  uuid: string;
  status: ProviderStatus;
  notifcationToken: string;
};

type ActiveOrders = {
  orderId: number;
  providerUuid: string;
  customerUuid: string;
};

interface ServerToClientEvents {
  'provider-online-finish': (data: { result: boolean }) => void;
  'provider-offline-finish': (data: { result: boolean }) => void;
  'online-users': (data: ProviderSocket[]) => void;
  'notify-order-add': (data: ActiveOrders) => void;
  'notify-order-remove': (data: ActiveOrders) => void;
  'notify-active-order-remove': (data: ActiveOrders) => void;
  'order-accepted': (data: { result: boolean; orderId: number; providerId: number; userId: number }) => void;
  'order-rejected': (data: { result: boolean; orderId: number; message?: string }) => void;
  'set-active-order': (data: { orderId: number }) => void;
  'order-timeout': () => void;
  'provider-to-customer-location-change': (data: {
    longitude: number;
    latitude: number;
    providerId: number;
    userId: number;
  }) => void;
  'provider-to-customer-arrived': (data: { orderId: number }) => void;
}

interface ClientToServerEvents {
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
}
//#endregion

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: { origin: '*' },
});

const prisma = prismaClient;

let onlineProviders: ProviderSocket[] = [];
let activeOrders: ActiveOrders[] = [];

//#region Functions
const addOrderHistory = async (orderId: number, reason: OrderHistory) => {
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

const broadcastOnlineProvider = (socket: CustomSocket) => {
  const filteredProviders = onlineProviders.filter((provider) => provider.status === ProviderStatus.Online);
  console.log(
    '[SOCKET - Broadcast online providers] Broadcasting online providers, Total Online Providers : ' +
      filteredProviders.length,
  );
  socket.broadcast.emit('online-users', filteredProviders);
  socket.emit('online-users', filteredProviders);
};

const addOnlineProvider = (
  { userId, providerId, longitude, latitude, uuid, notifcationToken, status }: ProviderSocket,
  socket: CustomSocket,
  isUpdate?: true,
) => {
  console.log('[SOCKET - Add/Update providers] Updating online providers, Provider User ID : ' + userId);
  console.log('[SOCKET - Add/Update providers] Received new statuss ' + status);
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
};

const removeOnlineProvider = (id: number, socket: CustomSocket) => {
  console.log('[SOCKET - Remove online provider] Provider went offline, Provider ID : ' + id);
  onlineProviders = onlineProviders.filter((provider) => provider.userId !== id);
  broadcastOnlineProvider(socket);
  socket.emit('provider-offline-finish', { result: true });
  socket.leave('providers');
};

const getActiveOrders = (id: any, searchKey: keyof ActiveOrders = 'orderId') => {
  const order = activeOrders.find((order) => order[searchKey] === id) as ActiveOrders;
  return order;
};

const addPendingOrder = (
  {
    customerUuid,
    orderId,
    providerUuid,
  }: {
    providerUuid: string;
    customerUuid: string;
    orderId: number;
  },
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
      },
    ],
    (a) => a.orderId,
  );
  socket.to(providerUuid).emit('notify-order-add', {
    providerUuid,
    customerUuid,
    orderId,
  });
};

const removePendingOrder = async (
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
      if (!ignoreNotifyOrderRemove)
        socket.emit('notify-order-remove', {
          customerUuid: order.customerUuid,
          orderId,
          providerUuid: order.providerUuid,
        });
    }
  }
};

const getOnlineProvider = (id: any, searchKey: keyof ProviderSocket = 'userId') => {
  const provider = onlineProviders.find((provider) => provider[searchKey] === id) as ProviderSocket;
  return provider;
};

const setProviderOffline = (providerId: number, socket: CustomSocket) => {
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
    console.log('[POST-SOCKET-ERROR] ');
  }
});
// #endregion

io.on('connection', (socket) => {
  socket.on('provider-online-start', (args) => {
    if (!socket.id && !args.uuid) {
      socket.emit('provider-online-finish', { result: false });
      return;
    }

    addOnlineProvider(
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

    addOnlineProvider({ ...provider }, socket, true);

    const order = getActiveOrders(provider.uuid, 'providerUuid');
    console.log('Provider location change');
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
      },
      socket,
    );

    const dateAfter60Sec = addSeconds(new Date(), 60);

    //Order timeout schedule job
    schedule.scheduleJob(dateAfter60Sec, async function () {
      // Check if the provider has job so cancel timout
      const selectedProvider = getOnlineProvider(args.providerId, 'providerId');
      if (selectedProvider.status !== ProviderStatus.HaveOrder) {
        socket.emit('order-timeout');

        await removePendingOrder(args.orderId, socket, OrderHistory.Timeout);
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

      addOnlineProvider({ ...provider, status: ProviderStatus.HaveOrder }, socket, true);

      socket.to(args.customerUuid).emit('order-accepted', {
        result: true,
        orderId: args.orderId,
        providerId: provider.providerId,
        userId: provider.userId,
      });

      socket.emit('set-active-order', { orderId: args.orderId });
    }
  });

  socket.on('provider-reject-order', async (args) => {
    await removePendingOrder(args.orderId, socket, OrderHistory.Rejected);

    socket.to(args.customerUuid).emit('order-rejected', { result: false, orderId: args.orderId });
  });

  socket.on('customer-reject-inprogress-order', async (args) => {
    const order = getActiveOrders(args?.orderId, 'orderId');
    if (order) {
      console.log('[SOCKET] Order found ', order.orderId);

      await removePendingOrder(args.orderId, socket, OrderHistory.CustomerCancelled, {
        isOrderActive: true,
      });

      socket.to(order.providerUuid).emit('notify-order-remove', {
        customerUuid: order.customerUuid,
        orderId: order.orderId,
        providerUuid: order.providerUuid,
      });
      // Below fallback if order is not found for any reason. Remove active order from provider so we don't block provider
    } else if (args.providerId) {
      const provider = getOnlineProvider(args.providerId, 'providerId');

      addOnlineProvider({ ...provider, status: ProviderStatus.Online }, socket, true);

      socket
        .to(provider?.uuid || '')
        .emit('notify-active-order-remove', { customerUuid: socket.id, orderId: -1, providerUuid: provider.uuid });
    }
  });

  socket.on('provider-arrived', async (args) => {
    //Get order
    const order = getActiveOrders(args.orderId);

    if (order) {
      // Append to order history
      await addOrderHistory(args.orderId, OrderHistory.ProviderArrived);

      // Notify customer
      socket.to(order.customerUuid).emit('provider-to-customer-arrived', { orderId: args.orderId });
    }
  });

  socket.on('disconnect', async () => {
    const provider = getOnlineProvider(socket.id, 'uuid');
    if (provider) {
      // Check if provider have any active order
      const order = getActiveOrders(provider.uuid, 'providerUuid');
      if (order) {
        await removePendingOrder(order.orderId, socket, OrderHistory.Cancelled, { isOrderActive: true });
      }
      setProviderOffline(provider.userId, socket);
    }
  });
});

export default io;

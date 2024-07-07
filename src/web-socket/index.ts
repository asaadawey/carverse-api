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
import { cancelOnHoldPayment, capturePayment } from 'src/utils/payment';

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
  moduleId: number;
  notifcationToken: string;
};

export type OrderDetails = { orderId: number, };

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
  type: "provider" | "customer",
  order: ActiveOrders & { moduleId: number }
}

type UserInfo = { UserTypeName: string; id: number }

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
  userInfo: UserInfo
}

type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>({
  cors: { origin: '*' },
});



export let onlineProviders: ProviderSocket[] = [];
export let activeOrders: ActiveOrders[] = [];

//#region Functions
export const addOrderHistory = async (orderId: number, reason: OrderHistory) => {
  const prisma = prismaClient;
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

export const addUpdateOnlineProvider = (
  providerArg: ProviderSocket,
  socket: CustomSocket,
  broadcast?: boolean,
  preferredSearchKey: keyof ProviderSocket = "userId"
) => {
  const { userId, providerId, longitude, latitude, uuid, notifcationToken, status, moduleId } = providerArg;
  console.log('[SOCKET - Add/Update providers] Updating online providers, Provider User ID : ' + userId);
  console.log('[SOCKET - Add/Update providers] Received new statuss ' + status);
  const provider = getProvider(providerArg[preferredSearchKey], preferredSearchKey)

  const filteredOnlineProviders = onlineProviders.filter((provider) => provider.userId !== userId);
  onlineProviders = _.uniqBy(
    [
      ...filteredOnlineProviders,
      {
        ...provider,
        userId,
        providerId,
        longitude,
        latitude,
        uuid,
        notifcationToken,
        status,
        moduleId
      },
    ],
    (a) => a.userId,
  );
  console.log('[SOCKET - Add/Update providers] New online providers : ', onlineProviders);

  if (broadcast) {
    broadcastOnlineProvider(socket);
    socket.emit('provider-online-finish', { result: true });
    socket.join('providers');
  }

};

export const removeOnlineProvider = (id: number, socket: CustomSocket) => {
  console.log('[SOCKET - Remove online provider] Provider went offline, Provider ID : ' + id);
  onlineProviders = onlineProviders.filter((provider) => provider.userId !== id);
  broadcastOnlineProvider(socket);
  socket.emit('provider-offline-finish', { result: true });
  socket.leave('providers');
};

export const getOrder = (id: any, searchKey: keyof ActiveOrders = 'orderId') => {
  const order = activeOrders.find((order) => order[String(searchKey)] === id) as ActiveOrders;
  return order;
};

export const addPendingOrder = (
  { customerUuid, orderId, providerUuid, customerUserId, providerUserId, customerNotificationToken: customerNotificationUuid }: ActiveOrders,
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
        customerUserId, providerUserId,
        customerNotificationToken: customerNotificationUuid,
      },
    ],
    (a) => a.orderId,
  );
  socket.to(providerUuid).emit('notify-order-add', {
    providerUuid,
    customerUuid,
    orderId,
    customerUserId,
    providerUserId,
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
  const order = getOrder(orderId);
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
            customerUserId: order.customerUserId,
            providerUserId: order.providerUserId,
            customerNotificationToken: order.customerNotificationToken,
          });
        } else {
          socket.to(order.providerUuid).emit('notify-order-remove', {
            customerUuid: order.customerUuid,
            orderId,
            customerUserId: order.customerUserId,
            providerUserId: order.providerUserId,
            providerUuid: order.providerUuid,
            customerNotificationToken: order.customerNotificationToken,
          });
        }
      }
    }
  }
};

export const getProvider = (id: any, searchKey: keyof ProviderSocket = 'userId') => {
  const provider = onlineProviders.find((provider) => provider[String(searchKey)] === id) as ProviderSocket;
  return provider;
};

export const setProviderOffline = async (providerId: number, socket: CustomSocket) => {
  // const providerOrders = activeOrders.filter((order) => order.providerUserId === socket.id);
  // providerOrders.forEach((order) => {
  //   socket.to(order.customerUuid).emit('order-rejected', {
  //     result: false,
  //     orderId: order.orderId,

  //     message: "Provider wen't offline",
  //   });
  // });

  // const provider = getProvider(providerId, 'providerId');

  // const sockets = await io.in([provider.uuid]).fetchSockets();

  // for (const socket of sockets) {
  //   socket.disconnect(true);
  // }

  removeOnlineProvider(providerId, socket);
};

export const checkActiveSession = (socket: CustomSocket, user: UserInfo | undefined) => {
  // Someone connected to socket and we need to identify if the connected user hace current session
  // If connected is customer => check the current in progress order
  // If connected is provider => check the current in progress order and pass it to order
  let toSearchKey: keyof ActiveOrders;
  if (user?.UserTypeName === "Customer") {
    toSearchKey = "customerUserId";
  } else toSearchKey = "customerUserId"; if (user?.UserTypeName === "Provider") {
    toSearchKey = "providerUserId";
  }
  const order = getOrder(user?.id, toSearchKey)

  // Update the current providers and orders
  if (user?.UserTypeName === "Customer" && order) {
    let newOrders = activeOrders.filter(aOrder => aOrder.orderId !== order.orderId);
    activeOrders = [...newOrders, { ...order, customerUuid: socket.id }]
  }

  if (order) {
    console.log("[SOCKET] Restoring active session ", { order, user })
    const provider = getProvider(order.providerUuid, "uuid")
    // Update providerUuid
    //Update providerUuid;


    if (provider) {
      addUpdateOnlineProvider({ ...provider, uuid: socket.id }, socket, true)
      socket.emit("notify-active-session", { type: user?.UserTypeName?.toLowerCase?.() as any, order: { ...order, moduleId: provider.moduleId } })
    }
  }
}
//#endregion

// #region IO Auth
io.use((socket, next) => {
  try {
    const apiValue = socket.handshake.auth[envVars.auth.apiKey];
    apiAuthMiddleware(apiValue);
    // inject user id coming from socket
    socket.data.userInfo = socket.handshake.auth['userInfo'];
    console.log("Connected")
    next();
  } catch (error: any) {
    next(error);
  }
});
// #endregion

io.on('connect', (socket) => {
  const user = socket.data.userInfo;
  console.log("user", user)

  checkActiveSession(socket, user);
})

io.on('connection', (socket) => {

  // socket.on('connect', () => {
  //   //@ts-ignore
  //   console.log("user", socket.userId)
  // })
  socket.on("force-check-active-session", (user) => {
    checkActiveSession(socket, user)
  })

  socket.on('provider-online-start', (args) => {
    if ((!socket.id && !args.uuid) || !args.userId || !args.providerId) {
      socket.emit('provider-online-finish', { result: false });
      return;
    }

    // Check if provider is already online0
    const online = getProvider(args.providerId, 'providerId');
    if (online) {
      // Check if provider has active order
      const order = getOrder(online.uuid, "providerUuid");
      if (order) {
        // if provider has active order. Then switch to the new client.
        addUpdateOnlineProvider({ ...online, uuid: socket.id }, socket, true);
        checkActiveSession(socket, { id: online.userId, UserTypeName: "Provider" })
        return;
      }
    }

    addUpdateOnlineProvider(
      {
        ...args,
        uuid: socket.id,
        status: ProviderStatus.Online,
      },
      socket,
      true
    );
  });

  socket.on('provider-offline-start', (args) => {
    setProviderOffline(args.id, socket);
  });

  socket.on('provider-online-location-change', (args) => {
    let provider = getProvider(args.userId);

    provider = { ...provider, ...args };

    addUpdateOnlineProvider({ ...provider }, socket);

    const order = getOrder(provider.uuid, 'providerUuid');
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
    const selectedProvider = getProvider(args.providerId, 'providerId');

    if (!selectedProvider) {
      cancelOnHoldPayment(args.orderId);
      socket.emit('order-timeout');
      return;
    }

    addPendingOrder(
      {
        customerUuid: args.customerUuid,
        orderId: args.orderId,
        customerUserId: args.customrUserId,
        providerUserId: selectedProvider.userId,
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
      const selectedProviderTimeout = getProvider(args.providerId, 'providerId');
      // Check if the provider has job so cancel timout
      if (selectedProviderTimeout && selectedProviderTimeout?.status !== ProviderStatus.HaveOrder) {
        socket.emit('order-timeout');

        await removePendingOrder(args.orderId, socket, OrderHistory.Timeout, { isOrderActive: false });

        cancelOnHoldPayment(args.orderId);
      }
    });
  });

  socket.on('all-online-providers', (moduleId) => {
    broadcastOnlineProvider(socket, moduleId);
  });

  socket.on('provider-accept-order', async (args) => {
    const order = getOrder(args.orderId);

    if (order) {
      console.log('[SOCKET] Order found , OrderID : ' + order.orderId);
      await removePendingOrder(args.orderId, socket, OrderHistory.Accepted, {
        ignoreNotifyOrderRemove: true,
        ignoreArrayRemove: true,
      });

      const provider = getProvider(order.providerUuid, 'uuid');

      addUpdateOnlineProvider({ ...provider, status: ProviderStatus.HaveOrder }, socket);

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
    const order = getOrder(args.orderId, 'orderId');
    sendNotification({
      data: {},
      description: 'Order Rejected',
      title: 'Unfortunatly, Provider have rejected the order. You can choose other provider',
      expoToken: order?.customerNotificationToken,
    });

    cancelOnHoldPayment(args.orderId);

    socket.to(args.customerUuid).emit('order-rejected', { result: false, orderId: args.orderId });
  });

  socket.on('customer-reject-inprogress-order', async (args) => {
    const order = getOrder(args?.orderId, 'orderId');

    const provider = getProvider(args.providerId, 'providerId');

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
        customerUserId: order.customerUserId,
        providerUserId: order.providerUserId

      });

      sendNotification({
        data: {},
        description: 'Order rejected by customer',
        title: 'Unfortunatly, Customer have rejected the order',
        expoToken: provider?.notifcationToken,
      });

      cancelOnHoldPayment(order.orderId);

      // Below fallback if order is not found for any reason. Remove active order from provider so we don't block provider
    }
    if (args.providerId) {
      addUpdateOnlineProvider({ ...provider, status: ProviderStatus.Online }, socket, true);

      socket.to(provider?.uuid || '').emit('notify-active-order-remove', {
        customerUuid: socket?.id,
        orderId: order?.orderId,
        providerUuid: provider?.uuid,
        customerNotificationToken: order?.customerNotificationToken,
        customerUserId: order?.customerUserId,
        providerUserId: provider?.userId
      });
    }
  });

  socket.on('provider-arrived', async (args) => {
    //Get order
    const order = getOrder(args.orderId);

    const provider = getProvider(order.providerUuid, 'uuid');

    if (order && provider) {
      // Should check if provider arrived within radius

      // Append to order history
      await addOrderHistory(order.orderId, OrderHistory.ProviderArrived);

      sendNotification({
        data: {},
        description: 'Provider arrived',
        title: 'Provider have confirmed that he have arrived to your car !',
        expoToken: order?.customerNotificationToken,
      });

      // Notify customer
      socket.to(order.customerUuid).emit('provider-to-customer-arrived', { orderId: args.orderId });
    }
  });

  socket.on('provider-finished-order', (args) => {
    const order = getOrder(args.orderId, 'orderId');

    if (order) {
      const provider = getProvider(order.providerUuid, 'uuid');

      if (provider) {
        console.log("Sending update to customer", { provider, order })
        sendNotification({
          data: {},
          description: 'Provider finsihed order',
          title: 'Provider have finished your order. Please confirm by clicking here !',
          expoToken: order?.customerNotificationToken,
        });

        socket.to(order.customerUuid).emit('provider-to-customer-finished-confirmation', args);
      }
    }
  });

  socket.on('customer-confirms-finished-order', async (args) => {
    const order = getOrder(args.orderId, 'orderId');

    if (order) {
      const provider = getProvider(order.providerUuid, 'uuid');

      if (provider) {
        if (args.result) {
          await removePendingOrder(args.orderId, socket, OrderHistory.ServiceFinished, {
            isOrderActive: true,
          });

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
          await capturePayment(order.orderId);

          addUpdateOnlineProvider({ ...provider, status: ProviderStatus.Online }, socket, true);

          socket.to(order.providerUuid).emit('customer-to-provider-finished-order', args);

          socket.emit('provider-to-customer-finished-confirmation', { orderId: args.orderId });
        } else {
          socket.to(order.providerUuid).emit('customer-to-provider-finished-order', args);
        }
      }
    }
  });

  socket.on('disconnect', async (args) => {
    // const provider = getProvider(socket.id, 'uuid');
    // if (provider) {
    //   // Check if provider have any active order
    //   const order = getOrder(provider.uuid, 'providerUuid');
    //   if (order) {
    //     // await removePendingOrder(order.orderId, socket, OrderHistory.Cancelled, { isOrderActive: true });

    //     // cancelOnHoldPayment(order.orderId);

    //     // sendNotification({
    //     //   data: {},
    //     //   description:
    //     //     'Unfortuantly, Provider have unexpectedly disconnected. You can choose another provider by pressing her',
    //     //   title: 'Provider disconnected',
    //     //   expoToken: order.customerNotificationToken,
    //     // });

    //     // socket.to(order.customerUuid).emit('provider-offline-finish', { result: true });
    //   }
    //   // //@ts-ignore
    //   // if (args?.forceRemoveProvider)
    //   //   setProviderOffline(provider.userId, socket);
    // }
    // For any reasons if customer logged out
    // const order = getOrder(socket.id, 'customerUuid');
    // if (order) {
    // await removePendingOrder(order.orderId, socket, OrderHistory.Cancelled, { isOrderActive: true });

    // cancelOnHoldPayment(order.orderId);

    // const provider = getProvider(order.providerUuid, 'uuid');

    // sendNotification({
    //   data: {},
    //   description: 'Unfortuanlty, Customer have unexpectedly disconnected.',
    //   title: 'Customer disconnected',
    //   expoToken: provider?.notifcationToken,
    // });

    // socket.to(order.providerUuid).emit('notify-active-order-remove', order);
    // }
  });
});

export default io;

// #region Functions for unit testing ONLY
export const resetVars = () => {
  onlineProviders = [];
  activeOrders = []
}
export const getOnlineProvider = () => {
  return onlineProviders
};
// #endregion

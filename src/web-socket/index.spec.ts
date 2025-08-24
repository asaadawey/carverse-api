import ioBack, {
  ActiveOrders,
  ClientToServerEvents,
  OrderAccept,
  OrderDetails,
  OrderReject,
  ProviderSocket,
  ProviderStatus,
  ServerToClientEvents,
  resetVars,
  setOrderTimeout,
} from './index';
import { io as ioClient, Socket } from 'socket.io-client';
import http from 'http';
import envVars from '@src/config/environment';
import { jest } from '@jest/globals';
import { PaymentMethods } from '@src/interfaces/enums';

// Mock the Redis manager for tests
jest.mock('@src/utils/socketRedisManager', () => {
  // In-memory storage for testing
  let testProviders: any[] = [];
  let testOrders: any[] = [];

  return {
    // Initialize function
    initializeSocketData: jest.fn().mockImplementation(async () => ({ providers: 0, orders: 0 })),

    // Provider methods
    getAllProviders: jest.fn().mockImplementation(async () => [...testProviders]),
    addProvider: jest.fn().mockImplementation(async (provider: any) => {
      testProviders = [...testProviders.filter((p: any) => p.userId !== provider.userId), provider];
      return [...testProviders];
    }),
    updateProvider: jest.fn().mockImplementation(async (searchKey: any, searchValue: any, newValues: any) => {
      const provider = testProviders.find((p: any) => p[searchKey] === searchValue);
      if (provider) {
        const updatedProvider = { ...provider, ...newValues };
        testProviders = [...testProviders.filter((p: any) => p[searchKey] !== searchValue), updatedProvider];
        return updatedProvider;
      }
      return undefined;
    }),
    removeProvider: jest.fn().mockImplementation(async (searchKey: any, searchValue: any) => {
      const provider = testProviders.find((p: any) => p[searchKey] === searchValue);
      if (provider) {
        testProviders = testProviders.filter((p: any) => p[searchKey] !== searchValue);
      }
      return provider;
    }),
    getProvider: jest.fn().mockImplementation(async (searchKey: any, searchValue: any) => {
      return testProviders.find((p: any) => p[searchKey] === searchValue);
    }),

    // Order methods
    getAllOrders: jest.fn().mockImplementation(async () => [...testOrders]),
    addOrder: jest.fn().mockImplementation(async (order: any) => {
      testOrders = [...testOrders.filter((o: any) => o.orderId !== order.orderId), order];
      return [...testOrders];
    }),
    updateOrder: jest.fn().mockImplementation(async (searchKey: any, searchValue: any, newValues: any) => {
      const order = testOrders.find((o: any) => o[searchKey] === searchValue);
      if (order) {
        const updatedOrder = { ...order, ...newValues };
        testOrders = [...testOrders.filter((o: any) => o[searchKey] !== searchValue), updatedOrder];
        return updatedOrder;
      }
      return undefined;
    }),
    removeOrder: jest.fn().mockImplementation(async (searchKey: any, searchValue: any) => {
      const order = testOrders.find((o: any) => o[searchKey] === searchValue);
      if (order) {
        testOrders = testOrders.filter((o: any) => o[searchKey] !== searchValue);
      }
      return order;
    }),
    getOrder: jest.fn().mockImplementation(async (searchKey: any, searchValue: any) => {
      return testOrders.find((o: any) => o[searchKey] === searchValue);
    }),

    // Utility methods
    clearAll: jest.fn(),
    getTestData: jest.fn().mockImplementation(() => ({
      providers: [...testProviders],
      orders: [...testOrders],
    })),
  };
});

// Mock other dependencies
jest.mock('src/utils/sendNotification.ts');
jest.mock('src/utils/payment.ts');
jest.mock('firebase-admin');
describe('web-socket/index.ts [Socket logic]', () => {
  jest.setTimeout(20000);

  let socketClientCustomer: Socket<ServerToClientEvents, ClientToServerEvents>;
  let socketClientProvider: Socket<ServerToClientEvents, ClientToServerEvents>;
  let httpServer: http.Server;
  let httpServerAddr: any;
  // let socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
  let randomClient: ProviderSocket;

  // #region Function
  const delay = (time: number) => {
    return new Promise((resolve) => setTimeout(resolve, time));
  };

  const createNewOrder = async (orderId = 123) => {
    socketClientProvider.emit('provider-online-start', randomClient);

    await delay(500);

    socketClientCustomer.emit('new-order', {
      orderPaymentMethod: PaymentMethods.Cash,
      customerNotificationToken: '123',
      customerUuid: socketClientCustomer.id as string,
      orderId: orderId,
      providerId: randomClient.providerId,
      userId: randomClient.userId,
      customrUserId: 1,
    });
  };
  // #endregion

  /**
   * Setup WS & HTTP servers
   */
  beforeAll((done) => {
    httpServer = http.createServer().listen();
    httpServerAddr = httpServer.address();
    ioBack.listen(httpServer);
    done();
  });

  /**
   * Run before each test
   */
  beforeEach((done) => {
    setOrderTimeout(2);
    let isCustomerDone = false,
      isProviderDone = false;
    // Setup
    // Customer
    socketClientCustomer = ioClient(`http://[${httpServerAddr?.address}]:${httpServerAddr?.port || ''}`, {
      auth: {
        [envVars.auth.apiKey]: envVars.auth.apiValue,
      },
      reconnectionDelay: 5000,
      timeout: 30000,
    });

    socketClientCustomer.on('connect', () => {
      isCustomerDone = true;
      if (isCustomerDone && isProviderDone) done();
    });
    socketClientCustomer.on('connect_error', (error) => {
      done(error);
    });
    //
    // Provider
    socketClientProvider = ioClient(`http://[${httpServerAddr?.address}]:${httpServerAddr?.port || ''}`, {
      auth: {
        [envVars.auth.apiKey]: envVars.auth.apiValue,
      },
      reconnectionDelay: 5000,
      timeout: 30000,
    });

    socketClientProvider.on('connect', () => {
      randomClient = {
        latitude: 10,
        longitude: 10,
        notifcationToken: '',
        providerId: 1,
        status: ProviderStatus.Online,
        userId: 1,
        uuid: socketClientProvider.id as string,
        moduleId: 1,
      };
      isProviderDone = true;
      if (isCustomerDone && isProviderDone) done();
    });
    socketClientProvider.on('connect_error', (error) => {
      done(error);
    });
  });

  afterEach(async () => {
    if (socketClientCustomer.connected) {
      socketClientCustomer.disconnect();
    }
    if (socketClientProvider.connected) {
      socketClientProvider.disconnect();
    }
    await resetVars();
  });

  it('Should fail because authentication failed', (done) => {
    console.log('Start 1');
    // will build new socket without passing auth
    const unauthSocket = ioClient(`http://[${httpServerAddr?.address}]:${httpServerAddr?.port || ''}`, {});

    unauthSocket.on('connect', () => {
      done(new Error('should not come here'));
    });
    unauthSocket.on('connect_error', () => {
      done();
    });
  });

  it('[Provider-online] Should pass and make provider online', (done) => {
    console.log('Start 2');
    socketClientCustomer.emit('provider-online-start', randomClient);

    // Broadcast online user
    socketClientCustomer.on('online-users', (data) => {
      expect(data[0]).toMatchObject(randomClient);
    });

    // Make provider online
    socketClientCustomer.on('provider-online-finish', (arg) => {
      expect(arg.result).toBe(true);
      done();
    });
  });

  it('[Provider-online] Should fail because no id or provider id', (done) => {
    console.log('Start 3');
    randomClient.providerId = 0;
    socketClientCustomer.emit('provider-online-start', randomClient);

    // Broadcast online user
    socketClientCustomer.on('online-users', () => {
      done(new Error('should not come here'));
    });

    // Make provider online
    socketClientCustomer.on('provider-online-finish', (arg) => {
      expect(arg.result).toBe(false);
      done();
    });
  });

  // it('[Provider-online] get all online providers', (done) => {
  //   console.log('Start 4');
  //   // Broadcast online user
  //   socketClientCustomer.on('online-users', (online) => {
  //     expect(online.length).toEqual(0);
  //     done();
  //   });
  //   socketClientCustomer.emit('all-online-providers', 1);
  // }, 15000);

  it('[Provider-offline] remove provider from online users', (done) => {
    console.log('Start 5');
    socketClientProvider.emit('provider-online-start', randomClient);

    delay(500).then(() => {
      socketClientCustomer.on('online-users', (online) => {
        expect(online.length).toEqual(0);
        done();
      });

      socketClientProvider.emit('provider-offline-start', { id: randomClient.providerId });
    });
  });

  it('[New-order] should pass and create order', (done) => {
    console.log('Start 6');
    const orderId = 123;

    socketClientProvider.on('notify-order-add', (data) => {
      expect(data.orderId).toEqual(orderId);
      done();
    });

    createNewOrder(orderId);
  });

  it('[New-order] should return order timeout because no right provider passed', (done) => {
    socketClientCustomer.on('order-timeout', () => {
      done();
    });

    randomClient.providerId = 24234222; // wrong id
    (async () => {
      socketClientProvider.emit('provider-online-start', randomClient);

      await delay(500);

      socketClientCustomer.emit('new-order', {
        orderPaymentMethod: PaymentMethods.Cash,
        customerNotificationToken: '123',
        customerUuid: socketClientCustomer.id as string,
        orderId: 123,
        providerId: 1223425423534534534, // wrong id
        userId: randomClient.userId,
        customrUserId: 1,
      });
    })();
  });

  // it('[New-order] should return order timeout because no response received from customer', async () => {
  //   const orderId = 123;

  //   let isClientDone = false,
  //     receivedOrder: ActiveOrders | {} = {};

  //   socketClientCustomer.on('order-timeout', async () => {
  //     isClientDone = true;
  //   });

  //   socketClientProvider.on('notify-order-remove', async (args) => {
  //     receivedOrder = args;
  //   });

  //   await createNewOrder(orderId);
  //   await delay(9000);
  //   if (!isClientDone) throw new Error(JSON.stringify({ isClientDone }));

  //   expect((receivedOrder as ActiveOrders).orderId).toEqual(orderId);
  // });

  it('[New-order] should set active order to provider when accepting order', async () => {
    const orderId = 123;

    let receivedOrderAccepted: OrderAccept | {} = {},
      receivedSetActive: OrderDetails | {} = {},
      receivedCustomerLocationChange: any = {};

    socketClientCustomer.on('order-accepted', async (args) => {
      receivedOrderAccepted = args;
    });

    socketClientProvider.on('set-active-order', async (args) => {
      receivedSetActive = args;
    });

    socketClientCustomer.on('provider-to-customer-location-change', (args) => {
      receivedCustomerLocationChange = args;
    });

    await createNewOrder(orderId);

    socketClientProvider.emit('provider-accept-order', { customerUuid: socketClientCustomer.id as string, orderId });

    await delay(4500);

    expect(receivedCustomerLocationChange.userId).toEqual(randomClient.userId);
    expect(receivedCustomerLocationChange.providerId).toEqual(randomClient.providerId);
    expect((receivedSetActive as OrderDetails).orderId).toEqual(orderId);
    expect((receivedOrderAccepted as OrderAccept).orderId).toEqual(orderId);
    expect((receivedOrderAccepted as OrderAccept).userId).toEqual(randomClient.userId);
  });

  it('[New-order] should remove order when rejected', async () => {
    const orderId = 123;

    let receivedOrderRejected: OrderReject | {} = {},
      receivedNotifyOrderRemove: ActiveOrders | {} = {};

    socketClientCustomer.on('order-rejected', async (args) => {
      receivedOrderRejected = args;
    });

    socketClientProvider.on('notify-order-remove', async (args) => {
      receivedNotifyOrderRemove = args;
    });

    await createNewOrder(orderId);

    socketClientProvider.emit('provider-reject-order', { customerUuid: socketClientCustomer.id as string, orderId });

    await delay(4500);

    expect((receivedOrderRejected as OrderReject).orderId).toEqual(orderId);
    expect((receivedNotifyOrderRemove as ActiveOrders).orderId).toEqual(orderId);
  });

  it('[New-order] should remove the provider from online user when accepting order', async () => {
    const orderId = 123;
    let receivedOnlineUsers: ProviderSocket[] | [] = [];

    await createNewOrder(orderId);

    await delay(500);

    socketClientProvider.emit('provider-accept-order', { customerUuid: socketClientCustomer.id as string, orderId });

    socketClientCustomer.emit('all-online-providers', 1);

    socketClientCustomer.on('online-users', (args) => {
      receivedOnlineUsers = args;
    });

    await delay(1000);

    expect(receivedOnlineUsers.length).toEqual(0);
  });

  it('[New-order] should remove order and set provider online when customer reject in progress order', async () => {
    const orderId = 123;

    let receivedOrder: ActiveOrders | {} = {};

    let receivedOnlineUsers: ProviderSocket[] = [];

    await createNewOrder(orderId);

    await delay(500);

    socketClientProvider.emit('provider-accept-order', { customerUuid: socketClientCustomer.id as string, orderId });

    socketClientCustomer.emit('customer-reject-inprogress-order', {
      orderId: orderId,
      providerId: randomClient.providerId,
    });

    socketClientProvider.on('notify-active-order-remove', (data) => {
      receivedOrder = data;
    });

    socketClientCustomer.on('online-users', (users) => {
      receivedOnlineUsers = users;
    });

    await delay(5000);

    expect((receivedOrder as ActiveOrders).orderId).toEqual(orderId);
    expect(receivedOnlineUsers.length).toEqual(1);
  });
});

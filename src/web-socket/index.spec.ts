import ioBack, { ClientToServerEvents, ProviderSocket, ProviderStatus, ServerToClientEvents } from './index';
import { io as ioClient, Socket } from 'socket.io-client';
import http from 'http';
// import { Server } from 'socket.io';
import envVars from 'src/config/environment';

jest.setTimeout(90000);

let socketClientCustomer: Socket<ServerToClientEvents, ClientToServerEvents>;
let socketClientProvider: Socket<ServerToClientEvents, ClientToServerEvents>;
let httpServer: http.Server;
let httpServerAddr: any;
// let socketServer: Server<ClientToServerEvents, ServerToClientEvents>;
let randomClient: ProviderSocket;

// #region Function
const createNewOrder = (orderId = 123) => {
  socketClientProvider.emit('provider-online-start', randomClient);

  socketClientCustomer.emit('new-order', {
    customerNotificationToken: '123',
    customerUuid: socketClientCustomer.id,
    orderId: orderId,
    providerId: randomClient.providerId,
    userId: randomClient.userId,
  });
};

const delay = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
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
  let isCustomerDone = false,
    isProviderDone = false;
  // Setup
  // Customer
  socketClientCustomer = ioClient(`http://[${httpServerAddr?.address}]:${httpServerAddr?.port || ''}`, {
    auth: {
      [envVars.auth.apiKey]: envVars.auth.apiValue,
    },
  });

  socketClientCustomer.on('connect', () => {
    randomClient = {
      latitude: 10,
      longitude: 10,
      notifcationToken: '',
      providerId: 1,
      status: ProviderStatus.Online,
      userId: 1,
      uuid: socketClientCustomer.id,
    };
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
  });

  socketClientProvider.on('connect', () => {
    isProviderDone = true;
    if (isCustomerDone && isProviderDone) done();
  });
  socketClientProvider.on('connect_error', (error) => {
    done(error);
  });
});

afterEach((done) => {
  if (socketClientCustomer.connected) {
    socketClientCustomer.disconnect();
  }
  if (socketClientProvider.connected) {
    socketClientProvider.disconnect();
  }
  done();
});

it('Should fail because authentication failed', (done) => {
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

it('[Provider-online] get all online providers', (done) => {
  // Broadcast online user
  socketClientCustomer.on('online-users', (online) => {
    expect(online.length).toEqual(0);
    done();
  });
  socketClientCustomer.emit('all-online-providers');
});

it('[New-order] should pass and create order', (done) => {
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

  randomClient.providerId = 24234; // wrong id

  createNewOrder();
});

it('[New-order] should return order timeout because no response received from customer', async () => {
  const orderId = 123;

  let isClientDone = false,
    isProviderDone = false;

  socketClientCustomer.on('order-timeout', async () => {
    isClientDone = true;
  });

  socketClientProvider.on('notify-order-remove', async (args) => {
    expect(args.orderId).toEqual(orderId);

    isProviderDone = true;
  });

  createNewOrder(orderId);
  await delay(4500);
  if (!isClientDone || !isProviderDone) throw new Error(JSON.stringify({ isClientDone, isProviderDone }));
});

it('[New-order] should set active order to provider when accepting order', async () => {
  const orderId = 123;

  let isClientDone = false,
    isProviderDone = false,
    isCustomerChangedCalled = false;

  socketClientCustomer.on('order-accepted', async (args) => {
    expect(args.orderId).toEqual(orderId);
    isClientDone = true;
  });

  socketClientProvider.on('set-active-order', async (args) => {
    expect(args.orderId).toEqual(orderId);
    isProviderDone = true;
  });

  socketClientCustomer.on('provider-to-customer-location-change', (args) => {
    expect(args.userId).toEqual(randomClient.userId);
    isCustomerChangedCalled = true;
  });

  createNewOrder(orderId);

  socketClientProvider.emit('provider-accept-order', { customerUuid: socketClientCustomer.id, orderId });

  await delay(4500);
  if (!isClientDone || !isProviderDone || !isCustomerChangedCalled)
    throw new Error(JSON.stringify({ isCustomerChangedCalled, isClientDone, isProviderDone }));
});

it('[New-order] should remove order when rejected', async () => {
  const orderId = 123;

  let isClientDone = false,
    isProviderDone = false;

  socketClientCustomer.on('order-rejected', async (args) => {
    expect(args.orderId).toEqual(orderId);
    isClientDone = true;
  });

  socketClientProvider.on('notify-order-remove', async (args) => {
    expect(args.orderId).toEqual(orderId);
    isProviderDone = true;
  });

  createNewOrder(orderId);

  socketClientProvider.emit('provider-reject-order', { customerUuid: socketClientCustomer.id, orderId });

  await delay(4500);
  if (!isClientDone || !isProviderDone) throw new Error(JSON.stringify({ isClientDone, isProviderDone }));
});

it('[New-order] should remove the provider from online user when accepting order', (done) => {
  const orderId = 123;

  createNewOrder();

  socketClientProvider.emit('provider-accept-order', { customerUuid: socketClientCustomer.id, orderId });

  socketClientCustomer.on('online-users', (args) => {
    expect(args.length).toEqual(0);
    done();
  });

  delay(1500).then(() => {
    socketClientCustomer.emit('all-online-providers');
  });
});

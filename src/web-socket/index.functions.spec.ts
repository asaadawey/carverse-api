import { OrderHistory } from 'src/interfaces/enums';
import * as socketFunctions from './index';
import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';

jest.mock('socket.io');
jest.mock('@prisma/client');

describe('web-socket/index.ts [Socket functions]', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      broadcast: {
        emit: jest.fn(),
      },
      join: jest.fn(),
      emit: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('[addOrderHistory] Should pass and call orderHistory', async () => {
    await socketFunctions.addOrderHistory(123, OrderHistory.Accepted);

    expect(prismaMock.orderHistory.create).toHaveBeenCalled();
  });

  it('[broadcastOnlineProviders] Should pass and send online providers to all online users', () => {
    socketFunctions.broadcastOnlineProvider(mockSocket as any);
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('online-users', expect.anything());
    expect(mockSocket.emit).toHaveBeenCalledWith('online-users', expect.anything());
  });

  it('[addUpdateOnlineProviders] Should pass and add new online providers', () => {
    jest.spyOn(socketFunctions, 'broadcastOnlineProvider');
    socketFunctions.addUpdateOnlineProvider(
      {
        moduleId: 1,
        latitude: 123,
        longitude: 123,
        notifcationToken: '123',
        providerId: 1,
        status: socketFunctions.ProviderStatus.Online,
        userId: 1,
        uuid: '123',
      },
      mockSocket,
    );
    expect(mockSocket.join).toHaveBeenCalled();

    expect(socketFunctions.broadcastOnlineProvider).toHaveBeenCalled();
  });

  it('[addUpdateOnlineProviders] Should pass and add new online providers', () => {
    //@ts-ignore
    global.onlineProviders = [];
    jest.spyOn(socketFunctions, 'broadcastOnlineProvider');
    socketFunctions.addUpdateOnlineProvider(
      {
        moduleId: 1,
        latitude: 123,
        longitude: 123,
        notifcationToken: '123',
        providerId: 1,
        status: socketFunctions.ProviderStatus.Online,
        userId: 1,
        uuid: '123',
      },
      mockSocket,
    );
    expect(mockSocket.join).toHaveBeenCalled();

    expect(socketFunctions.broadcastOnlineProvider).toHaveBeenCalled();
  });
});

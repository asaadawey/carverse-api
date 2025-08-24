import { OrderHistory } from '@src/interfaces/enums';
import * as socketFunctions from './index';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { jest } from '@jest/globals';

jest.mock('socket.io');
jest.mock('@prisma/client');
jest.mock('firebase-admin');

// Mock SocketRedisManager
jest.mock('@src/utils/socketRedisManager', () => ({
  getAllProviders: jest.fn(() =>
    Promise.resolve([
      { status: 'Online', moduleId: 1, id: 'provider1' },
      { status: 'Offline', moduleId: 1, id: 'provider2' },
      { status: 'Online', moduleId: 2, id: 'provider3' },
    ]),
  ),
}));

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
    await socketFunctions.addOrderHistory({} as any, OrderHistory.Accepted, '');

    expect(prismaMock.orderHistory.create).toHaveBeenCalled();
  });

  it('[broadcastOnlineProviders] Should pass and send online providers to all online users', async () => {
    await socketFunctions.broadcastOnlineProvider(mockSocket as any);
    expect(mockSocket.broadcast.emit).toHaveBeenCalledWith('online-users', expect.anything());
    expect(mockSocket.emit).toHaveBeenCalledWith('online-users', expect.anything());
  });
});

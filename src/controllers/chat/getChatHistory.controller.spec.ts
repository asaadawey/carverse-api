import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getChatHistory from './getChatHistory.controller';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { getChatHistory as getSocketChatHistory } from '@src/web-socket/chatSocket';
import { userHasAccessToOrder } from '@src/utils/orderUtils';
import { UserTypes, HTTPResponses } from '@src/interfaces/enums';
import { HttpException } from '@src/errors/index';
import { MessageType } from '@src/types/chat.types';

// Mock the external dependencies
jest.mock('@src/web-socket/chatSocket');
jest.mock('@src/utils/orderUtils');

const mockGetSocketChatHistory = getSocketChatHistory as jest.MockedFunction<typeof getSocketChatHistory>;
const mockUserHasAccessToOrder = userHasAccessToOrder as jest.MockedFunction<typeof userHasAccessToOrder>;

describe('getChatHistory Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getChatHistory).toBeDefined();
  });

  describe('successful cases', () => {
    it('should successfully get chat history for admin user without access check', async () => {
      const mockChatHistory = {
        orderId: 123,
        messages: [],
        page: 1,
        limit: 50,
        totalPages: 1,
        totalMessages: 0,
        hasMore: false,
      };

      global.mockReq.params = { orderId: '123' };
      global.mockReq.user = { id: 1, userType: UserTypes.Admin };
      global.mockReq.language = 'en';

      mockGetSocketChatHistory.mockResolvedValue(mockChatHistory);

      await getChatHistory(global.mockReq, global.mockRes, global.mockNext);

      // Admin should bypass access check
      expect(mockUserHasAccessToOrder).not.toHaveBeenCalled();
      expect(mockGetSocketChatHistory).toHaveBeenCalledWith(123);
      expect(createSuccessResponse).toHaveBeenCalledWith(
        global.mockReq,
        global.mockRes,
        mockChatHistory,
        global.mockNext,
      );
    });
  });
});

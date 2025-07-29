import sendEmailOtp from './sendEmailOtp.controller';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { HttpException } from '@src/errors/index';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPResponses } from '@src/interfaces/enums';

// Mock dependencies
jest.mock('@src/utils/logger');

describe('Send Email OTP Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockReq.body = { email: 'test@example.com' };
    global.mockReq.headers = { req_id: 'test-request-id' };
  });

  it('should successfully send OTP with valid email', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await sendEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: { Email: 'test@example.com' },
      select: {
        id: true,
        Email: true,
        isActive: true,
      },
    });

    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        success: true,
        message: 'OTP sent to your email address',
        otpSent: true,
      },
      global.mockNext,
    );
  });

  it('should throw error when user not found', async () => {
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(null);

    await sendEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.InvalidUsernameOrPassowrd, 'User not found'),
      global.mockNext,
    );
  });

  it('should throw error when user is inactive', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: false,
    };

    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await sendEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: 1,
      }),
      global.mockNext,
    );
  });

  it('should handle database errors gracefully', async () => {
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockRejectedValue(new Error('Database error'));

    await sendEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, expect.any(Error), global.mockNext);
  });
});

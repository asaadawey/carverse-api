import verifyEmailOtp from './verifyEmailOtp.controller';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { HttpException } from '@src/errors/index';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';

// Mock dependencies
jest.mock('@src/utils/logger');

describe('Verify Email OTP Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockReq.body = { email: 'test@example.com', otp: '123456' };
    global.mockReq.headers = { req_id: 'test-request-id' };
  });

  it('should successfully verify OTP with valid data', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

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
        message: 'OTP verified successfully',
        verified: true,
      },
      global.mockNext,
    );
  });

  it('should throw error when user not found', async () => {
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(null);

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

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

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: 1,
      }),
      global.mockNext,
    );
  });

  it('should throw error with invalid OTP format - too short', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    global.mockReq.body.otp = '123'; // Invalid OTP (too short)
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'Invalid OTP format'),
      global.mockNext,
    );
  });

  it('should throw error with invalid OTP format - non-numeric', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    global.mockReq.body.otp = 'abc123'; // Invalid OTP (contains letters)
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'Invalid OTP format'),
      global.mockNext,
    );
  });

  it('should throw error with empty OTP', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    global.mockReq.body.otp = ''; // Empty OTP
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'Invalid OTP format'),
      global.mockNext,
    );
  });

  it('should handle database errors gracefully', async () => {
    //@ts-ignore`r`n    prismaMock.users.findUnique.mockRejectedValue(new Error('Database error'));

    await verifyEmailOtp(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, expect.any(Error), global.mockNext);
  });
});

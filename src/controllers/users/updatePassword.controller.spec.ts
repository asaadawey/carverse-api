import updatePassword from './updatePassword.controller';
import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { HttpException } from '@src/errors/index';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import { HTTPErrorMessages, HTTPResponses } from '@src/interfaces/enums';
import { generateHashedString } from '@src/utils/encrypt';

// Mock dependencies
jest.mock('@src/utils/encrypt');
jest.mock('@src/utils/logger');

const mockGenerateHashedString = generateHashedString as jest.MockedFunction<typeof generateHashedString>;

describe('Update Password Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.mockReq.body = { email: 'test@example.com', newPassword: 'newpassword123', otp: '123456' };
    global.mockReq.headers = { req_id: 'test-request-id' };
  });

  it('should successfully update password with valid data', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    //@ts-ignore
    prismaMock.users.findUnique.mockResolvedValue(mockUser);
    mockGenerateHashedString.mockResolvedValue('hashedNewPassword');
    //@ts-ignore
    prismaMock.users.update.mockResolvedValue({});

    await updatePassword(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: { Email: 'test@example.com' },
      select: {
        id: true,
        Email: true,
        isActive: true,
      },
    });

    expect(mockGenerateHashedString).toHaveBeenCalledWith('newpassword123');

    expect(prismaMock.users.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        Password: 'hashedNewPassword',
        ModifiedOn: expect.any(Date),
      },
    });

    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        success: true,
        message: 'Password updated successfully',
      },
      global.mockNext,
    );
  });

  it('should throw error when user not found', async () => {
    //@ts-ignore
    prismaMock.users.findUnique.mockResolvedValue(null);

    await updatePassword(global.mockReq, global.mockRes, global.mockNext);

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

    //@ts-ignore
    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await updatePassword(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.AccountInactive, {
        userId: 1,
      }),
      global.mockNext,
    );
  });

  it('should throw error with invalid OTP', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    global.mockReq.body.otp = '123'; // Invalid OTP (too short)
    //@ts-ignore
    prismaMock.users.findUnique.mockResolvedValue(mockUser);

    await updatePassword(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.any(HttpException),
      global.mockNext,
    );
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = {
      id: 1,
      Email: 'test@example.com',
      isActive: true,
    };

    //@ts-ignore
    prismaMock.users.findUnique.mockResolvedValue(mockUser);
    mockGenerateHashedString.mockResolvedValue('hashedNewPassword');
    //@ts-ignore
    prismaMock.users.update.mockRejectedValue(new Error('Database error'));

    await updatePassword(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, expect.any(Error), global.mockNext);
  });
});

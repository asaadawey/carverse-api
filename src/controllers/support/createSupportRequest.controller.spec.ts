import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import createSupportRequest from './createSupportRequest.controller';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as emailService from '@src/services/emailService';

// Mock the email service
jest.mock('@src/services/emailService', () => ({
  sendSupportRequestEmail: jest.fn(),
}));

const mockSendSupportRequestEmail = emailService.sendSupportRequestEmail as jest.MockedFunction<
  typeof emailService.sendSupportRequestEmail
>;

describe('support/createSupportRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should successfully create support request without email', async () => {
    const mockSupportRequest = {
      id: 'cm1a2b3c4d5e6f7g8h9i0j',
      userId: 12345,
      relatedOrderId: null,
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
      status: 'OPEN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.supportRequests.create.mockResolvedValue(mockSupportRequest as any);

    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
      where: { id: 12345 },
      select: {
        Email: true,
        FirstName: true,
        LastName: true,
      },
    });

    expect(prismaMock.supportRequests.create).toHaveBeenCalledWith({
      data: {
        userId: 12345,
        relatedOrderId: undefined,
        issueDescription: 'Test issue description for support',
        contactUserByRegisteredMobile: true,
        sendEmail: false,
      },
    });

    expect(mockSendSupportRequestEmail).not.toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        supportId: 'cm1a2b3c4d5e6f7g8h9i0j',
        message: 'Support request created successfully',
      },
      global.mockNext,
    );
  });

  it('Should successfully create support request with email notification', async () => {
    const mockSupportRequest = {
      id: 'cm1a2b3c4d5e6f7g8h9i0j',
      userId: 12345,
      relatedOrderId: null,
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
      status: 'OPEN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.supportRequests.create.mockResolvedValue(mockSupportRequest as any);
    mockSendSupportRequestEmail.mockResolvedValue(true);

    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.supportRequests.create).toHaveBeenCalledWith({
      data: {
        userId: 12345,
        relatedOrderId: undefined,
        issueDescription: 'Test issue description for support',
        contactUserByRegisteredMobile: false,
        sendEmail: true,
      },
    });

    expect(mockSendSupportRequestEmail).toHaveBeenCalledWith(
      'test@example.com',
      'cm1a2b3c4d5e6f7g8h9i0j',
      'Test issue description for support',
    );

    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        supportId: 'cm1a2b3c4d5e6f7g8h9i0j',
        message: 'Support request created successfully',
        emailSent: true,
      },
      global.mockNext,
    );
  });

  it('Should successfully create support request with related order', async () => {
    const mockSupportRequest = {
      id: 'cm1a2b3c4d5e6f7g8h9i0j',
      userId: 12345,
      relatedOrderId: 999,
      issueDescription: 'Issue with order 999',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
      status: 'OPEN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    const mockOrder = {
      id: 999,
      customer: { UserID: 12345 },
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.orders.findFirst.mockResolvedValue(mockOrder as any);
    prismaMock.supportRequests.create.mockResolvedValue(mockSupportRequest as any);

    global.mockReq.body = {
      relatedOrderId: 999,
      issueDescription: 'Issue with order 999',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(prismaMock.orders.findFirst).toHaveBeenCalledWith({
      where: {
        id: 999,
        customer: {
          UserID: 12345,
        },
      },
    });

    expect(prismaMock.supportRequests.create).toHaveBeenCalledWith({
      data: {
        userId: 12345,
        relatedOrderId: 999,
        issueDescription: 'Issue with order 999',
        contactUserByRegisteredMobile: true,
        sendEmail: false,
      },
    });

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
  });

  it('Should fail when user is not authenticated', async () => {
    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
    };
    global.mockReq.user = undefined;

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.objectContaining({
        message: 'User not authenticated',
      }),
      global.mockNext,
    );
  });

  it('Should fail when user is not found', async () => {
    prismaMock.users.findUnique.mockResolvedValue(null);

    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.objectContaining({
        message: 'User not found',
      }),
      global.mockNext,
    );
  });

  it('Should fail when related order does not exist or does not belong to user', async () => {
    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.orders.findFirst.mockResolvedValue(null);

    global.mockReq.body = {
      relatedOrderId: 999,
      issueDescription: 'Issue with order 999',
      contactUserByRegisteredMobile: true,
      sendEmail: false,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.objectContaining({
        message: 'Order not found or does not belong to user',
      }),
      global.mockNext,
    );
  });

  it('Should handle email service failure gracefully', async () => {
    const mockSupportRequest = {
      id: 'cm1a2b3c4d5e6f7g8h9i0j',
      userId: 12345,
      relatedOrderId: null,
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
      status: 'OPEN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.supportRequests.create.mockResolvedValue(mockSupportRequest as any);
    mockSendSupportRequestEmail.mockResolvedValue(false);

    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        supportId: 'cm1a2b3c4d5e6f7g8h9i0j',
        message: 'Support request created successfully',
        emailSent: false,
      },
      global.mockNext,
    );
  });

  it('Should handle email service exception gracefully', async () => {
    const mockSupportRequest = {
      id: 'cm1a2b3c4d5e6f7g8h9i0j',
      userId: 12345,
      relatedOrderId: null,
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
      status: 'OPEN',
      createdAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockUser = {
      id: 12345,
      Email: 'test@example.com',
      FirstName: 'John',
      LastName: 'Doe',
    };

    prismaMock.users.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.supportRequests.create.mockResolvedValue(mockSupportRequest as any);
    mockSendSupportRequestEmail.mockRejectedValue(new Error('Email service error'));

    global.mockReq.body = {
      issueDescription: 'Test issue description for support',
      contactUserByRegisteredMobile: false,
      sendEmail: true,
    };
    global.mockReq.user = { id: 12345 };

    await createSupportRequest(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      {
        supportId: 'cm1a2b3c4d5e6f7g8h9i0j',
        message: 'Support request created successfully',
        emailSent: false,
      },
      global.mockNext,
    );
  });
});

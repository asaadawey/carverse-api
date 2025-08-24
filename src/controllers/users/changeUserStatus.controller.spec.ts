import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import changeUserStatus from './changeUserStatus.controller';
import { createSuccessResponse } from '@src/responses/index';
import { sendAccountActivationEmail } from '@src/services/emailService';
import sendNotification from '@src/utils/sendNotification';

// Mock the email service and notification function
jest.mock('@src/services/emailService', () => ({
  sendAccountActivationEmail: jest.fn(),
}));

jest.mock('@src/utils/sendNotification', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockSendAccountActivationEmail = sendAccountActivationEmail as jest.MockedFunction<
  typeof sendAccountActivationEmail
>;
const mockSendNotification = sendNotification as jest.MockedFunction<typeof sendNotification>;

describe('changeUserStatus Controller - Basic Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(changeUserStatus).toBeDefined();
  });

  it('should call createSuccessResponse when user is updated', async () => {
    const mockUser = {
      id: 123,
      FirstName: 'Test',
      LastName: 'User',
      Email: 'test@example.com',
      isActive: true,
      LastKnownNotificationToken: null,
      userTypes: {
        TypeName: 'Customer',
      },
    };

    global.mockReq.params = { userId: '123' };
    global.mockReq.body = { isActive: false };
    global.mockReq.user = { id: 1, userType: 'Admin' };

    prismaMock.users.findUnique.mockResolvedValue(mockUser);
    prismaMock.users.update.mockResolvedValue({
      id: 123,
      isActive: false,
      ModifiedOn: new Date(),
    });

    await changeUserStatus(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalled();
  });

  it('should send email and notification when activating inactive user', async () => {
    const mockUser = {
      id: 123,
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'john.doe@example.com',
      isActive: false, // User is currently inactive
      LastKnownNotificationToken: 'test-notification-token-123',
      userTypes: {
        TypeName: 'Customer',
      },
    };

    global.mockReq.params = { userId: '123' };
    global.mockReq.body = { isActive: true }; // Activating user
    global.mockReq.user = { id: 1, userType: 'Admin' };

    prismaMock.users.findUnique.mockResolvedValue(mockUser);
    prismaMock.users.update.mockResolvedValue({
      id: 123,
      isActive: true,
      ModifiedOn: new Date(),
    });

    // Mock successful email and notification
    mockSendAccountActivationEmail.mockResolvedValue(true);
    mockSendNotification.mockResolvedValue({ result: true, message: 'Success' });

    await changeUserStatus(global.mockReq, global.mockRes, global.mockNext);

    // Verify email was sent
    expect(mockSendAccountActivationEmail).toHaveBeenCalledWith('john.doe@example.com', 'John', 'Doe');

    // Verify notification was sent
    expect(mockSendNotification).toHaveBeenCalledWith({
      data: { userId: 123, action: 'account_activated' },
      title: '🎉 Account Activated!',
      description:
        'Welcome back John! Your CarVerse account has been activated and you can now login to access all our services.',
      expoToken: 'test-notification-token-123',
    });

    expect(createSuccessResponse).toHaveBeenCalled();
  });

  it('should not send email/notification when deactivating user', async () => {
    const mockUser = {
      id: 123,
      FirstName: 'John',
      LastName: 'Doe',
      Email: 'john.doe@example.com',
      isActive: true, // User is currently active
      LastKnownNotificationToken: 'test-notification-token-123',
      userTypes: {
        TypeName: 'Customer',
      },
    };

    global.mockReq.params = { userId: '123' };
    global.mockReq.body = { isActive: false }; // Deactivating user
    global.mockReq.user = { id: 1, userType: 'Admin' };

    prismaMock.users.findUnique.mockResolvedValue(mockUser);
    prismaMock.users.update.mockResolvedValue({
      id: 123,
      isActive: false,
      ModifiedOn: new Date(),
    });

    await changeUserStatus(global.mockReq, global.mockRes, global.mockNext);

    // Verify email and notification were NOT sent
    expect(mockSendAccountActivationEmail).not.toHaveBeenCalled();
    expect(mockSendNotification).not.toHaveBeenCalled();

    expect(createSuccessResponse).toHaveBeenCalled();
  });
});

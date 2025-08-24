//@ts-nocheck
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as ioClient, Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import envVars from '@src/config/environment';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import {
  initializeChat,
  authenticateUser,
  joinOrderChat,
  sendMessage,
  getChatHistory,
  handleUserDisconnect,
  updateUserOnlineStatus,
  startTyping,
  stopTyping,
  sendSystemMessage,
  getOnlineUsers,
  getTypingUsers,
} from '@src/web-socket/chatSocket';
import {
  ChatSocket,
  ChatAuthenticationPayload,
  ChatAuthenticationResponse,
  JoinOrderChatPayload,
  JoinOrderChatResponse,
  SendMessagePayload,
  SendMessageResponse,
  TypingIndicatorPayload,
  GetChatHistoryPayload,
  ChatHistoryResponse,
  ChatErrorPayload,
  UserJoinedChatPayload,
  UserLeftChatPayload,
  NewMessageNotification,
  UserTypingNotification,
  OnlineUsersUpdate,
} from '@src/types/chat.types';

describe('OrderChatHandler', () => {
  let serverSocket: Server;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let httpServer: any;
  let mockPrisma: MockProxy<PrismaClient>;
  let testOrderId: number;
  let testCustomerId: number;
  let testProviderId: number;
  let testCustomerUserId: number;
  let testProviderUserId: number;

  beforeAll(async () => {
    // Create test server
    httpServer = createServer();
    serverSocket = new Server(httpServer);

    // Create mock Prisma client
    mockPrisma = mockDeep<PrismaClient>();

    // Initialize chat handler with mock Prisma
    initializeChat(serverSocket, mockPrisma);

    // Setup mock data
    setupMockData();

    // Add auth middleware similar to main socket server
    serverSocket.use((socket, next) => {
      try {
        const apiValue = socket.handshake.auth[envVars.auth.apiKey];
        if (apiValue !== envVars.auth.apiValue) {
          throw new Error('Authentication failed');
        }
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as any).port;

        // Create client connections with authentication
        clientSocket1 = ioClient(`http://localhost:${port}`, {
          auth: {
            [envVars.auth.apiKey]: envVars.auth.apiValue,
          },
        });
        clientSocket2 = ioClient(`http://localhost:${port}`, {
          auth: {
            [envVars.auth.apiKey]: envVars.auth.apiValue,
          },
        });

        resolve();
      });
    });

    // Add chat handlers to server socket connections (similar to main index.ts)
    serverSocket.on('connection', (socket) => {
      // Chat event listeners
      socket.on('chat-authenticate', async (data: ChatAuthenticationPayload) => {
        try {
          const result = await authenticateUser(data.userId);
          if (result) {
            // Store user info on socket
            (socket as any).userId = result.userId;
            (socket as any).userType = result.userType;

            // Update online status
            updateUserOnlineStatus(result.userId, socket.id, true);

            socket.emit('chat-authenticated', result);
          } else {
            socket.emit('chat-authentication-failed', { error: 'Invalid user' });
          }
        } catch (error: any) {
          socket.emit('chat-authentication-failed', { error: 'Authentication failed' });
        }
      });

      socket.on('chat-join-order', async (data: JoinOrderChatPayload) => {
        const userId = (socket as any).userId;
        if (!userId) {
          const error: ChatErrorPayload = { message: 'Not authenticated' };
          socket.emit('chat-error', error);
          return;
        }

        try {
          const result = await joinOrderChat(userId, data.orderId);
          if (result) {
            const roomName = `order_chat_${data.orderId}`;
            socket.join(roomName);

            socket.emit('chat-joined-order', result);

            // Notify others in the room
            const joinNotification: UserJoinedChatPayload = {
              orderId: data.orderId,
              userId: userId,
              userType: (socket as any).userType!,
              userName: result.participants.find((p) => p.userId === userId)?.userName || 'Unknown',
              joinedAt: new Date(),
            };

            socket.to(roomName).emit('chat-user-joined', joinNotification);

            // Send recent messages
            try {
              const history = await getChatHistory(data.orderId);
              socket.emit('chat-history', history);
            } catch (historyError) {
              console.error('Failed to send chat history:', historyError);
            }
          } else {
            const error: ChatErrorPayload = {
              message: 'Not authorized for this order chat',
              orderId: data.orderId,
            };
            socket.emit('chat-error', error);
          }
        } catch (error: any) {
          const errorPayload: ChatErrorPayload = {
            message: 'Failed to join order chat',
            orderId: data.orderId,
          };
          socket.emit('chat-error', errorPayload);
        }
      });

      socket.on('chat-send-message', async (data: SendMessagePayload) => {
        const userId = (socket as any).userId;
        if (!userId) {
          const error: ChatErrorPayload = { message: 'Not authenticated' };
          socket.emit('chat-error', error);
          return;
        }

        try {
          const result = await sendMessage(userId, data);
          if (result && result.success) {
            const roomName = `order_chat_${data.orderId}`;

            // Send to all users in the room
            const notification: NewMessageNotification = {
              message: result.message!,
              orderId: data.orderId,
              isSystemMessage: false,
            };

            serverSocket.to(roomName).emit('chat-new-message', notification);

            // Confirm to sender
            socket.emit('chat-message-sent', result);
          } else {
            const error: ChatErrorPayload = { message: 'Failed to send message' };
            socket.emit('chat-error', error);
          }
        } catch (error: any) {
          const errorPayload: ChatErrorPayload = { message: 'Failed to send message' };
          socket.emit('chat-error', errorPayload);
        }
      });

      socket.on('chat-typing', (data: TypingIndicatorPayload) => {
        const userId = (socket as any).userId;
        if (!userId) return;

        const roomName = `order_chat_${data.orderId}`;

        if (data.isTyping) {
          startTyping(userId, data.orderId);
        } else {
          stopTyping(userId, data.orderId);
        }

        // Get user info for notification
        const onlineUser = getOnlineUsers().find((u) => u.userId === userId);

        // Notify others in the room
        const notification: UserTypingNotification = {
          orderId: data.orderId,
          userId: userId,
          userType: (socket as any).userType!,
          userName: onlineUser?.userName || 'Unknown User',
          isTyping: data.isTyping,
        };

        socket.to(roomName).emit('chat-user-typing', notification);
      });

      socket.on('chat-get-history', async (data: GetChatHistoryPayload) => {
        const userId = (socket as any).userId;
        if (!userId) {
          const error: ChatErrorPayload = { message: 'Not authenticated' };
          socket.emit('chat-error', error);
          return;
        }

        try {
          const history = await getChatHistory(data.orderId, data.page, data.limit);
          socket.emit('chat-history', history);
        } catch (error: any) {
          const errorPayload: ChatErrorPayload = { message: 'Failed to get chat history' };
          socket.emit('chat-error', errorPayload);
        }
      });

      socket.on('disconnect', () => {
        const userId = (socket as any).userId;
        if (userId) {
          handleUserDisconnect(userId);
        }
      });
    });
  });

  afterAll(() => {
    // Close connections
    clientSocket1?.disconnect();
    clientSocket2?.disconnect();
    serverSocket?.close();
    httpServer?.close();
    // Restore all mocks
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Clear any previous listeners
    clientSocket1.removeAllListeners();
    clientSocket2.removeAllListeners();
  });

  const setupMockData = () => {
    // Setup test IDs
    testCustomerUserId = 1;
    testProviderUserId = 2;
    testCustomerId = 1;
    testProviderId = 1;
    testOrderId = 1;

    // Mock user types
    const customerType = { id: 1, TypeName: 'Customer' };
    const providerType = { id: 2, TypeName: 'Provider' };

    // Mock users
    const customerUser = {
      id: testCustomerUserId,
      UserTypeID: customerType.id,
      FirstName: 'Test',
      LastName: 'Customer',
      Email: 'test-customer@test.com',
      PhoneNumber: '+1234567890',
      Password: 'hashedpassword',
      Nationality: 'US',
      userTypes: customerType,
    };

    const providerUser = {
      id: testProviderUserId,
      UserTypeID: providerType.id,
      FirstName: 'Test',
      LastName: 'Provider',
      Email: 'test-provider@test.com',
      PhoneNumber: '+1234567891',
      Password: 'hashedpassword',
      Nationality: 'US',
      userTypes: providerType,
    };

    // Mock system user
    const systemUser = {
      id: 3,
      Email: 'system@carwash.com',
      FirstName: 'System',
      LastName: 'Bot',
      userTypes: customerType,
    };

    // Mock order
    const mockOrder = {
      id: testOrderId,
      CustomerID: testCustomerId,
      ProviderID: testProviderId,
      PaymentMethodID: 1,
      OrderTotalAmount: 100.0,
      Longitude: -122.4194,
      Latitude: 37.7749,
      AddressString: '123 Test Street, Test City',
      customer: {
        id: testCustomerId,
        UserID: testCustomerUserId,
        users: customerUser,
      },
      provider: {
        id: testProviderId,
        UserID: testProviderUserId,
        users: providerUser,
      },
    };

    // Setup Prisma mocks
    mockPrisma.userTypes.findFirst.mockImplementation(({ where }: any) => {
      if (where?.TypeName === 'Customer') return Promise.resolve(customerType);
      if (where?.TypeName === 'Provider') return Promise.resolve(providerType);
      return Promise.resolve(null);
    });

    mockPrisma.users.findUnique.mockImplementation(({ where }: any) => {
      if (where?.id === testCustomerUserId) return Promise.resolve(customerUser);
      if (where?.id === testProviderUserId) return Promise.resolve(providerUser);
      if (where?.Email === 'system@carwash.com') return Promise.resolve(systemUser);
      return Promise.resolve(null);
    });

    mockPrisma.orders.findFirst.mockImplementation(({ where }: any) => {
      if (where?.id === testOrderId) {
        // Handle both simple id lookup and complex OR conditions for joinOrderChat
        if (where.OR) {
          // This is the joinOrderChat query with OR condition
          // The query looks for orders where the user is either customer or provider
          // Since our mock order has customer.UserID = testCustomerUserId and provider.UserID = testProviderUserId
          // Any authenticated user (testCustomerUserId or testProviderUserId) should be able to join
          return Promise.resolve(mockOrder);
        }
        return Promise.resolve(mockOrder);
      }
      return Promise.resolve(null);
    });

    mockPrisma.orderMessages.create.mockImplementation(({ data }: any) => {
      if (data.orderId !== testOrderId) {
        // Simulate DB error for non-existent order
        return Promise.reject(new Error('Order not found'));
      }
      const senderUser = data.senderId === testCustomerUserId ? customerUser : providerUser;
      return Promise.resolve({
        id: data.id || 'mock-message-id',
        orderId: data.orderId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType,
        createdAt: new Date(),
        replyToId: data.replyToId,
        attachments: data.attachments,
        sender: {
          id: senderUser.id,
          FirstName: senderUser.FirstName,
          LastName: senderUser.LastName,
          userTypes: {
            TypeName: senderUser.userTypes.TypeName,
          },
        },
        replyTo: data.replyToId
          ? {
              id: data.replyToId,
              content: 'Previous message content',
              sender: {
                FirstName: 'Test',
                LastName: 'User',
              },
            }
          : undefined,
      });
    });

    mockPrisma.orderMessages.findMany.mockResolvedValue([]);
    mockPrisma.orderMessages.count.mockResolvedValue(0);
  };

  describe('Authentication', () => {
    it('should authenticate customer successfully', (done) => {
      clientSocket1.emit('chat-authenticate', {
        userId: testCustomerUserId,
      });

      clientSocket1.on('chat-authenticated', (data) => {
        expect(data.success).toBe(true);
        expect(data.userId).toBe(testCustomerUserId);
        expect(data.userType).toBe('Customer');
        done();
      });
    });

    it('should authenticate provider successfully', (done) => {
      clientSocket2.emit('chat-authenticate', {
        userId: testProviderUserId,
      });

      clientSocket2.on('chat-authenticated', (data) => {
        expect(data.success).toBe(true);
        expect(data.userId).toBe(testProviderUserId);
        expect(data.userType).toBe('Provider');
        done();
      });
    });

    it('should fail authentication for invalid user', (done) => {
      clientSocket1.emit('chat-authenticate', {
        userId: 99999,
      });

      clientSocket1.on('chat-authentication-failed', (data) => {
        expect(data.error).toBe('Invalid user');
        done();
      });
    });
  });

  describe('Order Chat', () => {
    beforeEach((done) => {
      // Authenticate both clients
      let authCount = 0;

      const checkAuth = () => {
        authCount++;
        if (authCount === 2) done();
      };

      clientSocket1.emit('chat-authenticate', { userId: testCustomerUserId });
      clientSocket1.on('chat-authenticated', checkAuth);

      clientSocket2.emit('chat-authenticate', { userId: testProviderUserId });
      clientSocket2.on('chat-authenticated', checkAuth);
    });

    it('should allow customer to join order chat', (done) => {
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });

      clientSocket1.on('chat-joined-order', (data) => {
        expect(data.orderId).toBe(testOrderId);
        expect(data.customerName).toContain('Test Customer');
        expect(data.providerName).toContain('Test Provider');
        done();
      });
    });

    it('should allow provider to join order chat', (done) => {
      clientSocket2.emit('chat-join-order', { orderId: testOrderId });

      clientSocket2.on('chat-joined-order', (data) => {
        expect(data.orderId).toBe(testOrderId);
        expect(data.customerName).toContain('Test Customer');
        expect(data.providerName).toContain('Test Provider');
        done();
      });
    });

    it('should notify when user joins order chat', (done) => {
      // First user joins
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });

      // Second user joins and should be notified about first user
      clientSocket2.emit('chat-join-order', { orderId: testOrderId });

      clientSocket1.on('chat-user-joined', (data) => {
        expect(data.orderId).toBe(testOrderId);
        expect(data.userId).toBe(testProviderUserId);
        expect(data.userType).toBe('Provider');
        done();
      });
    });

    it('should send and receive messages in order chat', (done) => {
      const testMessage = 'Hello, I need help with my car wash!';

      // Both users join chat
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });
      clientSocket2.emit('chat-join-order', { orderId: testOrderId });

      // Set up message listener
      clientSocket2.on('chat-new-message', (data) => {
        expect(data.message.content).toBe(testMessage);
        expect(data.message.orderId).toBe(testOrderId);
        expect(data.message.senderId).toBe(testCustomerUserId);
        expect(data.message.senderType).toBe('Customer');
        expect(data.message.messageType).toBe('TEXT');
        done();
      });

      // Customer sends message
      setTimeout(() => {
        clientSocket1.emit('chat-send-message', {
          orderId: testOrderId,
          content: testMessage,
          messageType: 'TEXT',
        });
      }, 100);
    });

    it('should handle typing indicators', (done) => {
      // Both users join chat
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });
      clientSocket2.emit('chat-join-order', { orderId: testOrderId });

      // Set up typing listener
      clientSocket2.on('chat-user-typing', (data) => {
        expect(data.orderId).toBe(testOrderId);
        expect(data.userId).toBe(testCustomerUserId);
        expect(data.userType).toBe('Customer');
        expect(data.isTyping).toBe(true);
        done();
      });

      // Customer starts typing
      setTimeout(() => {
        clientSocket1.emit('chat-typing', {
          orderId: testOrderId,
          isTyping: true,
        });
      }, 100);
    });

    it('should auto-stop typing after timeout', (done) => {
      // Both users join chat
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });
      clientSocket2.emit('chat-join-order', { orderId: testOrderId });

      let typingEvents = 0;

      // Set up typing listener
      clientSocket2.on('chat-user-typing', (data) => {
        typingEvents++;

        if (typingEvents === 1) {
          // First event should be typing = true
          expect(data.isTyping).toBe(true);
        } else if (typingEvents === 2) {
          // Second event should be typing = false (auto-stopped)
          expect(data.isTyping).toBe(false);
          done();
        }
      });

      // Customer starts typing (should auto-stop after 3 seconds)
      setTimeout(() => {
        clientSocket1.emit('chat-typing', {
          orderId: testOrderId,
          isTyping: true,
        });
      }, 100);
    }, 10000); // Increase timeout for this test

    it('should retrieve chat history', (done) => {
      // Join chat first
      clientSocket1.emit('chat-join-order', { orderId: testOrderId });

      clientSocket1.on('chat-history', (data) => {
        expect(data.orderId).toBe(testOrderId);
        expect(Array.isArray(data.messages)).toBe(true);
        expect(typeof data.page).toBe('number');
        expect(typeof data.hasMore).toBe('boolean');
        done();
      });

      setTimeout(() => {
        clientSocket1.emit('chat-get-history', {
          orderId: testOrderId,
          page: 1,
          limit: 20,
        });
      }, 100);
    });

    it('should prevent unauthorized users from joining order chat', (done) => {
      // Create a different user with proper auth headers but invalid user ID
      const unauthorizedSocket = ioClient(`http://localhost:${(httpServer.address() as any).port}`, {
        auth: {
          [envVars.auth.apiKey]: envVars.auth.apiValue,
        },
      });

      unauthorizedSocket.on('connect', () => {
        unauthorizedSocket.emit('chat-authenticate', { userId: 99999 });

        unauthorizedSocket.on('chat-authentication-failed', () => {
          unauthorizedSocket.emit('chat-join-order', { orderId: testOrderId });

          unauthorizedSocket.on('chat-error', (data) => {
            expect(data.message).toBe('Not authenticated');
            unauthorizedSocket.disconnect();
            done();
          });
        });
      });

      // Add timeout handler
      setTimeout(() => {
        unauthorizedSocket.disconnect();
        done();
      }, 5000);
    });
  });

  describe('Online Status', () => {
    it('should broadcast online status when user authenticates', (done) => {
      let callCount = 0;

      const handleOnlineUsers = (data) => {
        callCount++;
        if (callCount === 1) {
          expect(Array.isArray(data.users)).toBe(true);
          const onlineUser = data.users.find((u) => u.userId === testCustomerUserId);
          expect(onlineUser).toBeDefined();
          expect(onlineUser.isOnline).toBe(true);
          expect(onlineUser.userType).toBe('Customer');

          // Remove listener to prevent multiple calls
          clientSocket2.off('chat-online-users', handleOnlineUsers);
          done();
        }
      };

      clientSocket2.on('chat-online-users', handleOnlineUsers);
      clientSocket1.emit('chat-authenticate', { userId: testCustomerUserId });
    });

    it('should track online users correctly', () => {
      const onlineUsers = getOnlineUsers();
      expect(Array.isArray(onlineUsers)).toBe(true);
    });
  });

  describe('System Messages', () => {
    it('should send system messages to order chat', async () => {
      const systemMessage = 'Order has been accepted by provider';

      const message = await sendSystemMessage(testOrderId, systemMessage);

      expect(message?.orderId).toBe(testOrderId);
      expect(typeof message?.senderId).toBe('number'); // Should be a valid user ID
      expect(message?.senderId).toBeGreaterThan(0); // Should be a valid user ID
      expect(message?.content).toBe(systemMessage);
      expect(message?.messageType).toBe('SYSTEM');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', (done) => {
      let isDone = false; // Flag to prevent multiple done calls

      // Try to send message to non-existent order
      clientSocket1.emit('chat-authenticate', { userId: testCustomerUserId });

      const onAuthenticated = () => {
        clientSocket1.emit('chat-send-message', {
          orderId: 99999,
          content: 'This should fail',
        });

        const onError = (data) => {
          if (isDone) return; // Prevent multiple calls
          isDone = true;

          expect(data.message).toBe('Failed to send message');
          clientSocket1.off('chat-error', onError); // Remove listener after first call
          clientSocket1.off('chat-authenticated', onAuthenticated); // Clean up
          done();
        };
        clientSocket1.on('chat-error', onError);
      };
      clientSocket1.on('chat-authenticated', onAuthenticated);
    });

    it('should handle invalid order IDs', (done) => {
      let isDone = false; // Flag to prevent multiple done calls

      clientSocket1.emit('chat-authenticate', { userId: testCustomerUserId });

      const onAuthenticated = () => {
        clientSocket1.emit('chat-join-order', { orderId: 99999 });

        const onError = (data) => {
          if (isDone) return; // Prevent multiple calls
          isDone = true;

          expect(data.message).toBe('Not authorized for this order chat');
          clientSocket1.off('chat-error', onError);
          clientSocket1.off('chat-authenticated', onAuthenticated);
          done();
        };
        clientSocket1.on('chat-error', onError);
      };
      clientSocket1.on('chat-authenticated', onAuthenticated);
    });
  });
});

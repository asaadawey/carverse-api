import { Request, Response } from 'express';
import getAllUsers from './getAllUsers.controller';

// Mock dependencies
jest.mock('@src/responses/index');

describe('getAllUsers Controller', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let mockPrisma: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrisma = {
      users: {
        findMany: jest.fn(),
      },
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockReq = {
      query: {
        page: '1',
        limit: '20',
      },
      user: {
        id: 1,
        name: 'Test App',
        authorisedEncryptedClient: 'test-client',
        timestamp: new Date(),
        applicationVersion: '1.0.0',
        userType: 'Admin',
      },
      prisma: mockPrisma,
      logger: mockLogger,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should retrieve all users successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 1,
          Email: 'user1@example.com',
          PhoneNumber: '+1234567890',
          FirstName: 'John',
          LastName: 'Doe',
          isActive: true,
          ModifiedOn: new Date(),
          CreatedOn: new Date(),
          Nationality: 'US',
          isEmailVerified: true,
          LastLoginDate: new Date(),
          userTypes: { TypeName: 'Customer' },
        },
        {
          id: 2,
          Email: 'user2@example.com',
          PhoneNumber: '+1234567891',
          FirstName: 'Jane',
          LastName: 'Smith',
          isActive: false,
          ModifiedOn: new Date(),
          CreatedOn: new Date(),
          Nationality: 'US',
          isEmailVerified: false,
          LastLoginDate: null,
          userTypes: { TypeName: 'Provider' },
        },
      ];

      mockPrisma.users.findMany.mockResolvedValue(mockUsers);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
        select: {
          id: true,
          Email: true,
          PhoneNumber: true,
          FirstName: true,
          LastName: true,
          isActive: true,
          ModifiedOn: true,
          CreatedOn: true,
          Nationality: true,
          isEmailVerified: true,
          LastLoginDate: true,
          userTypes: {
            select: {
              TypeName: true,
            },
          },
        },
        orderBy: {
          CreatedOn: 'desc',
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Admin retrieved users list',
        expect.objectContaining({
          adminId: 1,
          totalUsers: 2,
          filters: { userType: undefined, isActive: undefined, search: undefined },
        }),
      );
    });

    it('should filter users by userType', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, userType: 'Customer' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userTypes: {
              TypeName: 'Customer',
            },
          },
        }),
      );
    });

    it('should filter users by active status', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, isActive: 'true' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );
    });

    it('should filter users by inactive status', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, isActive: 'false' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: false,
          },
        }),
      );
    });

    it('should search users by name and email', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, search: 'john' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { FirstName: { contains: 'john', mode: 'insensitive' } },
              { LastName: { contains: 'john', mode: 'insensitive' } },
              { Email: { contains: 'john', mode: 'insensitive' } },
              { PhoneNumber: { contains: 'john' } },
            ],
          },
        }),
      );
    });

    it('should combine multiple filters', async () => {
      // Arrange
      mockReq.query = {
        ...mockReq.query,
        userType: 'Customer',
        isActive: 'true',
        search: 'john',
      };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userTypes: {
              TypeName: 'Customer',
            },
            isActive: true,
            OR: [
              { FirstName: { contains: 'john', mode: 'insensitive' } },
              { LastName: { contains: 'john', mode: 'insensitive' } },
              { Email: { contains: 'john', mode: 'insensitive' } },
              { PhoneNumber: { contains: 'john' } },
            ],
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      mockReq.query = { take: '10', skip: '10' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('Error Cases', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.users.findMany.mockRejectedValue(dbError);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(dbError, 'Error retrieving users list', { adminId: 1 });
    });

    it('should handle missing user in request', async () => {
      // Arrange
      mockReq.user = undefined;
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Admin retrieved users list',
        expect.objectContaining({
          adminId: undefined,
        }),
      );
    });

    it('should handle missing logger gracefully', async () => {
      // Arrange
      mockReq.logger = undefined;
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act & Assert - Should not throw error
      await expect(getAllUsers(mockReq as any, mockRes as Response, mockNext)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search string', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, search: '' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should handle empty result set', async () => {
      // Arrange
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Admin retrieved users list',
        expect.objectContaining({
          totalUsers: 0,
        }),
      );
    });

    it('should handle invalid isActive values', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, isActive: 'invalid' };
      mockPrisma.users.findMany.mockResolvedValue([]);

      // Act
      await getAllUsers(mockReq as any, mockRes as Response, mockNext);

      // Assert
      // Invalid isActive value 'invalid' becomes false (isActive === 'true' => false)
      expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: false },
        }),
      );
    });
  });
});

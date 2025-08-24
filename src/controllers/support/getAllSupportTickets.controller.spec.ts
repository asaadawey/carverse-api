import { Request, Response } from 'express';
import getAllSupportTickets from './getAllSupportTickets.controller';
import { SupportStatus } from '@prisma/client';
import { UserTypes } from '@src/interfaces/enums';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';

// Mock dependencies
jest.mock('@src/responses/index');

describe('getAllSupportTickets Controller', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let mockPrisma: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrisma = {
      supportRequests: {
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
        userType: UserTypes.Admin,
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

  describe('Admin User Success Cases', () => {
    it('should retrieve all support tickets for admin users', async () => {
      // Arrange
      const mockTickets = [
        {
          id: 1,
          issueDescription: 'Test issue 1',
          status: SupportStatus.OPEN,
          resolutionNotes: null,
          CreatedOn: new Date(),
          ModifiedOn: new Date(),
          users: {
            id: 2,
            Email: 'user1@example.com',
            FirstName: 'John',
            LastName: 'Doe',
          },
        },
        {
          id: 2,
          issueDescription: 'Test issue 2',
          status: SupportStatus.RESOLVED,
          resolutionNotes: 'Resolved successfully',
          CreatedOn: new Date(),
          ModifiedOn: new Date(),
          users: {
            id: 3,
            Email: 'user2@example.com',
            FirstName: 'Jane',
            LastName: 'Smith',
          },
        },
      ];

      mockPrisma.supportRequests.findMany.mockResolvedValue(mockTickets);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        where: {},
        include: {
          user: {
            select: {
              id: true,
              FirstName: true,
              LastName: true,
              Email: true,
              PhoneNumber: true,
            },
          },
          relatedOrder: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support tickets retrieved',
        expect.objectContaining({
          requesterId: 1,
          requesterType: UserTypes.Admin,
          totalTickets: 2,
        }),
      );
    });

    it('should filter tickets by status for admin users', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, status: SupportStatus.OPEN };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: SupportStatus.OPEN,
          },
        }),
      );
    });

    it('should handle pagination for admin users', async () => {
      // Arrange
      mockReq.query = { take: '10', skip: '10' };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('Regular User Success Cases', () => {
    it('should retrieve only own tickets for regular users', async () => {
      // Arrange
      mockReq.user = {
        id: 2,
        name: 'Test App',
        authorisedEncryptedClient: 'test-client',
        timestamp: new Date(),
        applicationVersion: '1.0.0',
        userType: UserTypes.Customer,
      };

      const mockTickets = [
        {
          id: 1,
          issueDescription: 'My issue',
          status: SupportStatus.OPEN,
          resolutionNotes: null,
          CreatedOn: new Date(),
          ModifiedOn: new Date(),
          users: {
            id: 2,
            Email: 'user@example.com',
            FirstName: 'John',
            LastName: 'Doe',
          },
        },
      ];

      mockPrisma.supportRequests.findMany.mockResolvedValue(mockTickets);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 2, // Should filter by user ID
          },
        }),
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support tickets retrieved',
        expect.objectContaining({
          requesterId: 2,
          requesterType: UserTypes.Customer,
          totalTickets: 1,
        }),
      );
    });

    it('should filter by status for regular users with own tickets only', async () => {
      // Arrange
      mockReq.user.userType = UserTypes.Provider;
      mockReq.user.id = 3;
      mockReq.query = { ...mockReq.query, status: SupportStatus.RESOLVED };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 3,
            status: SupportStatus.RESOLVED,
          },
        }),
      );
    });
  });

  describe('Error Cases', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.supportRequests.findMany.mockRejectedValue(dbError);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(dbError, 'Error retrieving support tickets', {
        userId: 1,
        userType: UserTypes.Admin,
      });
    });

    it('should handle missing user in request', async () => {
      // Arrange
      mockReq.user = undefined;

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(createFailResponse).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Error), mockNext);
    });

    it('should handle missing logger gracefully', async () => {
      // Arrange
      mockReq.logger = undefined;
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act & Assert - Should not throw error
      await expect(getAllSupportTickets(mockReq as any, mockRes as Response, mockNext)).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty result set', async () => {
      // Arrange
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support tickets retrieved',
        expect.objectContaining({
          totalTickets: 0,
        }),
      );
    });

    it('should handle invalid status values', async () => {
      // Arrange
      mockReq.query = { ...mockReq.query, status: 'INVALID_STATUS' };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      // Status value is passed through as-is (no validation in controller)
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'INVALID_STATUS' },
        }),
      );
    });

    it('should handle zero or negative pagination values', async () => {
      // Arrange
      mockReq.query = { take: '0', skip: '-5' };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      // Invalid values are passed through (converted to numbers: 0 and -5)
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -5,
          take: 0,
        }),
      );
    });

    it('should handle very large pagination values', async () => {
      // Arrange
      mockReq.query = { take: '1000', skip: '999999' };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 999999,
          take: 1000,
        }),
      );
    });

    it('should handle user with different userType formats', async () => {
      // Arrange
      mockReq.user.userType = 'ADMIN'; // Different format
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      // Should treat as non-admin and filter by userId
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 1,
          },
        }),
      );
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow admin to see all tickets regardless of filters', async () => {
      // Arrange
      mockReq.user.userType = UserTypes.Admin;
      mockReq.query = { status: SupportStatus.CLOSED };
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: SupportStatus.CLOSED,
            // No userId filter for admin
          },
        }),
      );
    });

    it('should restrict customer to own tickets only', async () => {
      // Arrange
      mockReq.user.userType = UserTypes.Customer;
      mockReq.user.id = 5;
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 5,
          },
        }),
      );
    });

    it('should restrict provider to own tickets only', async () => {
      // Arrange
      mockReq.user.userType = UserTypes.Provider;
      mockReq.user.id = 7;
      mockPrisma.supportRequests.findMany.mockResolvedValue([]);

      // Act
      await getAllSupportTickets(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 7,
          },
        }),
      );
    });
  });
});

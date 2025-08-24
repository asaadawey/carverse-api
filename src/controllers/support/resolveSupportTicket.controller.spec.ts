import { Request, Response } from 'express';
import resolveSupportTicket from './resolveSupportTicket.controller';
import { SupportStatus } from '@prisma/client';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';

// Mock dependencies
jest.mock('@src/responses/index');

describe('resolveSupportTicket Controller', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let mockPrisma: any;
  let mockLogger: any;

  beforeEach(() => {
    mockPrisma = {
      supportRequests: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    mockReq = {
      params: {
        ticketId: '123',
      },
      body: {
        status: SupportStatus.RESOLVED,
        resolutionNotes: 'Issue has been resolved',
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
    it('should resolve a support ticket successfully', async () => {
      // Arrange
      const existingTicket = {
        id: '123',
        issueDescription: 'Test issue',
        status: SupportStatus.IN_PROGRESS,
        userId: 1,
        user: {
          id: 1,
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
        relatedOrder: null,
      };

      const updatedTicket = {
        id: '123',
        status: SupportStatus.RESOLVED,
        updatedAt: new Date(),
        issueDescription: 'Test issue',
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockResolvedValue(updatedTicket);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          user: {
            select: {
              id: true,
              FirstName: true,
              LastName: true,
              Email: true,
            },
          },
          relatedOrder: {
            select: {
              id: true,
            },
          },
        },
      });

      expect(mockPrisma.supportRequests.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          status: SupportStatus.RESOLVED,
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          issueDescription: true,
        },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Support ticket resolved by admin',
        expect.objectContaining({
          adminId: 1,
          ticketId: '123',
          newStatus: SupportStatus.RESOLVED,
          previousStatus: SupportStatus.IN_PROGRESS,
          resolutionNotes: 'Issue has been resolved',
        }),
      );
    });

    it('should close a support ticket successfully', async () => {
      // Arrange
      mockReq.body = {
        status: SupportStatus.CLOSED,
        resolutionNotes: 'Ticket closed by admin',
      };

      const existingTicket = {
        id: '123',
        issueDescription: 'Test issue',
        status: SupportStatus.OPEN,
        resolutionNotes: null,
        CreatedOn: new Date(),
        ModifiedOn: new Date(),
        userId: 456,
        user: {
          id: 456,
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockResolvedValue({
        ...existingTicket,
        status: SupportStatus.CLOSED,
      });

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          status: SupportStatus.CLOSED,
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          issueDescription: true,
        },
      });
    });

    it('should resolve ticket without resolution notes', async () => {
      // Arrange
      mockReq.body = {
        status: SupportStatus.RESOLVED,
      };

      const existingTicket = {
        id: 123,
        issueDescription: 'Test issue',
        status: SupportStatus.OPEN,
        resolutionNotes: null,
        CreatedOn: new Date(),
        ModifiedOn: new Date(),
        users: {
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockResolvedValue({
        ...existingTicket,
        status: SupportStatus.RESOLVED,
      });

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          status: SupportStatus.RESOLVED,
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          issueDescription: true,
        },
      });
    });
  });

  describe('Error Cases', () => {
    it('should return error when ticket not found', async () => {
      // Arrange
      mockPrisma.supportRequests.findUnique.mockResolvedValue(null);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(createFailResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.any(Error),
        mockNext,
        expect.any(Number),
      );
    });

    it('should return error for already resolved ticket', async () => {
      // Arrange
      mockReq.body = {
        status: 'RESOLVED',
      };

      const existingTicket = {
        id: '123',
        issueDescription: 'Test issue',
        status: 'RESOLVED', // Already resolved
        userId: 1,
        user: {
          id: 1,
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'user@example.com',
        },
        relatedOrder: null,
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(createFailResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.any(Error),
        mockNext,
        expect.any(Number),
      );
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrisma.supportRequests.findUnique.mockRejectedValue(dbError);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(dbError, 'Error resolving support ticket', {
        adminId: 1,
        ticketId: '123',
      });
    });

    it('should handle update errors gracefully', async () => {
      // Arrange
      const existingTicket = {
        id: 123,
        issueDescription: 'Test issue',
        status: SupportStatus.OPEN,
        resolutionNotes: null,
        CreatedOn: new Date(),
        ModifiedOn: new Date(),
        users: {
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
      };

      const updateError = new Error('Update failed');
      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockRejectedValue(updateError);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(updateError, 'Error resolving support ticket', {
        adminId: 1,
        ticketId: '123',
      });
    });

    it('should handle missing user in request', async () => {
      // Arrange
      mockReq.user = undefined;

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(createFailResponse).toHaveBeenCalledWith(mockReq, mockRes, expect.any(Error), mockNext);
    });
  });

  describe('Edge Cases', () => {
    it('should handle string ticket ID', async () => {
      // Arrange
      mockReq.params = { ticketId: 'abc' }; // Non-numeric ID
      mockReq.body = {
        status: SupportStatus.RESOLVED,
        resolutionNotes: 'Test resolution',
      };

      // Mock ticket not found (which is expected for invalid ID)
      mockPrisma.supportRequests.findUnique.mockResolvedValue(null);

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert - should return fail response due to ticket not found
      expect(createFailResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        expect.any(Error),
        mockNext,
        404, // HTTPResponses.NotFound
      );
    });

    it('should handle missing logger gracefully', async () => {
      // Arrange
      mockReq.logger = undefined;
      const existingTicket = {
        id: 123,
        issueDescription: 'Test issue',
        status: SupportStatus.OPEN,
        resolutionNotes: null,
        CreatedOn: new Date(),
        ModifiedOn: new Date(),
        users: {
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockResolvedValue({
        ...existingTicket,
        status: SupportStatus.RESOLVED,
      });

      // Act & Assert - Should not throw error
      await expect(resolveSupportTicket(mockReq as any, mockRes as Response, mockNext)).resolves.not.toThrow();
    });

    it('should handle empty resolution notes', async () => {
      // Arrange
      mockReq.body = {
        status: SupportStatus.RESOLVED,
        resolutionNotes: '',
      };

      const existingTicket = {
        id: '123',
        issueDescription: 'Test issue',
        status: SupportStatus.OPEN,
        resolutionNotes: null,
        CreatedOn: new Date(),
        ModifiedOn: new Date(),
        userId: 456,
        user: {
          id: 456,
          Email: 'user@example.com',
          FirstName: 'John',
          LastName: 'Doe',
        },
      };

      mockPrisma.supportRequests.findUnique.mockResolvedValue(existingTicket);
      mockPrisma.supportRequests.update.mockResolvedValue({
        ...existingTicket,
        status: SupportStatus.RESOLVED,
        updatedAt: new Date(),
      });

      // Act
      await resolveSupportTicket(mockReq as any, mockRes as Response, mockNext);

      // Assert
      expect(mockPrisma.supportRequests.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          status: SupportStatus.RESOLVED,
          updatedAt: expect.any(Date),
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          issueDescription: true,
        },
      });
    });
  });
});

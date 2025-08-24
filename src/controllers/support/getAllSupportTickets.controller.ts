import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { UserTypes } from '@src/interfaces/enums';

//#region GetAllSupportTickets

type GetAllSupportTicketsParams = {};

type GetAllSupportTicketsRequestBody = {};

type GetAllSupportTicketsResponse = {
  id: string;
  userId: number;
  relatedOrderId: number | null;
  issueDescription: string;
  contactUserByRegisteredMobile: boolean;
  sendEmail: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber: string;
  };
  relatedOrder?: {
    id: number;
  } | null;
}[];

type GetAllSupportTicketsQueryParams = PaginatorQueryParamsProps & {
  userId?: string;
  status?: string;
  search?: string;
};

export const getAllSupportTicketsSchema = yup.object({
  query: yup.object().shape({
    userId: yup.string().optional(),
    status: yup.string().optional(),
    search: yup.string().optional(),
    ...paginationSchema.fields,
  }),
});

const getAllSupportTickets: RequestHandler<
  GetAllSupportTicketsParams,
  GetAllSupportTicketsResponse,
  GetAllSupportTicketsRequestBody,
  GetAllSupportTicketsQueryParams
> = async (req, res, next) => {
  try {
    const { userId, status, search } = req.query;
    const loggedInUserId = req.user?.id;
    const userType = req.user?.userType;

    // Build where clause based on user type
    const whereClause: any = {};

    // If user is admin, they can see all tickets or filter by userId
    if (userType === UserTypes.Admin) {
      if (userId) {
        const userIdNum = parseInt(userId, 10);
        if (isNaN(userIdNum)) {
          return createFailResponse(req, res, new Error('Invalid user ID'), next);
        }
        whereClause.userId = userIdNum;
      }
      // If no userId specified, admin sees all tickets
    } else {
      // For customers and providers, only show their own tickets
      whereClause.userId = loggedInUserId;
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Search functionality (for admins or in user's own tickets)
    if (search) {
      whereClause.OR = [{ issueDescription: { contains: search, mode: 'insensitive' } }];
    }

    const supportTickets = await req.prisma.supportRequests.findMany({
      ...spreadPaginationParams(req.query),
      where: whereClause,
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

    // Log the action
    if (req.logger) {
      req.logger.info('Support tickets retrieved', {
        requesterId: loggedInUserId,
        requesterType: userType,
        totalTickets: supportTickets.length,
        filters: { userId, status, search },
        timestamp: new Date().toISOString(),
      });
    }

    createSuccessResponse(req, res, supportTickets, next);
  } catch (error: any) {
    if (req.logger) {
      req.logger.error(error, 'Error retrieving support tickets', {
        userId: req.user?.id,
        userType: req.user?.userType,
      });
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllSupportTickets;

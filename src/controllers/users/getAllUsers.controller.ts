import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';

//#region GetAllUsers

type GetAllUsersLinkQuery = {};

type GetAllUsersRequestBody = {};

type GetAllUsersResponse = {
  id: number;
  Email: string;
  PhoneNumber: string;
  FirstName: string;
  LastName: string;
  isActive: boolean;
  ModifiedOn: Date;
  CreatedOn: Date;
  Nationality: string;
  isEmailVerified: boolean;
  LastLoginDate: Date | null;
  userTypes: {
    TypeName: string;
  };
}[];

type GetAllUsersQueryParams = PaginatorQueryParamsProps & {
  userType?: string;
  isActive?: string;
  search?: string;
};

export const getAllUsersSchema: yup.SchemaOf<{ query: GetAllUsersQueryParams }> = yup.object({
  query: yup.object().shape({
    userType: yup.string().optional(),
    isActive: yup.string().optional(),
    search: yup.string().optional(),
    ...paginationSchema.fields,
  }),
});

const getAllUsers: RequestHandler<
  GetAllUsersLinkQuery,
  GetAllUsersResponse,
  GetAllUsersRequestBody,
  GetAllUsersQueryParams
> = async (req, res, next) => {
  try {
    const { userType, isActive, search } = req.query;

    // Build where clause for filtering
    const whereClause: any = {};

    // Filter by user type if provided
    if (userType) {
      whereClause.userTypes = {
        TypeName: userType,
      };
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Search functionality
    if (search) {
      whereClause.OR = [
        { FirstName: { contains: search, mode: 'insensitive' } },
        { LastName: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } },
        { PhoneNumber: { contains: search } },
      ];
    }

    const users = await req.prisma.users.findMany({
      ...spreadPaginationParams(req.query),
      where: whereClause,
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

    // Log the action
    if (req.logger) {
      req.logger.info('Admin retrieved users list', {
        adminId: req.user?.id,
        totalUsers: users.length,
        filters: { userType, isActive, search },
        timestamp: new Date().toISOString(),
      });
    }

    createSuccessResponse(req, res, users, next);
  } catch (error: any) {
    if (req.logger) {
      req.logger.error(error, 'Error retrieving users list', {
        adminId: req.user?.id,
      });
    }
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllUsers;

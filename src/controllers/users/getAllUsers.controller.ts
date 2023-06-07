import * as yup from 'yup';
import { RequestHandler } from 'express';
import prisma from 'helpers/databaseHelpers/client';
import { createFailResponse, createSuccessResponse } from 'responses';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from 'interfaces/express.types';

//#region GetAllUsers

type GetAllUsersLinkQuery = {};

type GetAllUsersRequestBody = {};

type GetAllUsersResponse = {
  id: number;
  Email: string;
  PhoneNumber: string;
  FirstName: string;
  ModifiedOn: string;
  Nationality: string;
  userTypes: {
    TypeName: string;
  };
}[];

type GetAllUsersQueryParams = PaginatorQueryParamsProps;

export const getAllModulesSchema: yup.SchemaOf<{}> = yup.object({ query: yup.object().concat(paginationSchema) });

const getAllUsers: RequestHandler<
  GetAllUsersLinkQuery,
  GetAllUsersResponse,
  GetAllUsersRequestBody,
  GetAllUsersQueryParams
> = async (req, res, next) => {
  try {
    const users = await prisma.users.findMany({
      ...spreadPaginationParams(req.query),
      select: {
        id: true,
        Email: true,
        PhoneNumber: true,
        FirstName: true,
        ModifiedOn: true,
        Nationality: true,
        userTypes: {
          select: {
            TypeName: true,
          },
        },
      },
    });
    createSuccessResponse(req, res, users, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllUsers;

import * as yup from 'yup';
import { RequestHandler } from 'express';
// import { createFailResponse } from 'src/responses';
import { PaginatorQueryParamsProps, paginationSchema } from 'src/interfaces/express.types';
import { createFailResponse } from 'src/responses';

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
    //WIP
    // const users = await req.prisma.users.findMany({
    //   ...spreadPaginationParams(req.query),
    //   select: {
    //     id: true,
    //     Email: true,
    //     PhoneNumber: true,
    //     FirstName: true,
    //     ModifiedOn: true,
    //     Nationality: true,
    //     userTypes: {
    //       select: {
    //         TypeName: true,
    //       },
    //     },
    //   },
    // });
    // createSuccessResponse(req, res, users, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllUsers;

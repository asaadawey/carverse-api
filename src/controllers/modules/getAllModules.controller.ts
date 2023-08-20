import * as yup from 'yup';
import { RequestHandler } from 'express';
import prisma from 'src/helpers/databaseHelpers/client';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from 'src/interfaces/express.types';

//#region GetModules

type GetModulesLinkQuery = {};

type GetModulesRequestBody = {};

type GetModulesResponse = {
  id: number;
  ModuleName: string;
  ModuleDescription: string;
  ModuleIconLink: string;
}[];

type GetModulesQueryParams = PaginatorQueryParamsProps;
export const getAllModulesSchema: yup.SchemaOf<{}> = yup.object({ query: yup.object().concat(paginationSchema) });

const getAllModules: RequestHandler<
  GetModulesLinkQuery,
  GetModulesResponse,
  GetModulesRequestBody,
  GetModulesQueryParams
> = async (req, res, next) => {
  try {
    const modules = await prisma.modules.findMany({
      ...spreadPaginationParams(req.query),
      where: { isActive: { equals: true } },
      select: { id: true, ModuleName: true, ModuleDescription: true, ModuleIconLink: true },
    });
    createSuccessResponse(req, res, modules, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllModules;

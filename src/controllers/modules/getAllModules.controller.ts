import * as yup from 'yup';
import { RequestHandler } from 'express';
import prisma from 'helpers/databaseHelpers/client';
import { createFailResponse, createSuccessResponse } from 'responses';

//#region GetModules

type GetModulesLinkQuery = {};

type GetModulesRequestBody = {};

type GetModulesResponse = {
  id: number;
  ModuleName: string;
  ModuleDescription: string;
  ModuleIconLink: string;
}[];

type GetModulesQueryParams = {};

export const getAllModulesSchema: yup.SchemaOf<{}> = yup.object({});

const getAllModules: RequestHandler<
  GetModulesLinkQuery,
  GetModulesResponse,
  GetModulesRequestBody,
  GetModulesQueryParams
> = async (req, res, next) => {
  try {
    const modules = await prisma.modules.findMany({
      select: { id: true, ModuleName: true, ModuleDescription: true, ModuleIconLink: true },
    });
    createSuccessResponse(req, res, modules, next);
  } catch (err) {
    createFailResponse(req, res, err, next);
  }
};

//#endregion

export default getAllModules;

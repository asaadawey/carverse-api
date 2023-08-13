import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { paginationSchema, spreadPaginationParams } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
//#region GetAllServices
type GetAllServicesParams = {
  moduleId: string;
};

type GetAllServicesRequestBody = {};

type GetAllServicesResponse = {
  id: number;
  ServiceName: string;
  ServiceDescription: string;
  ServicePrice: Prisma.Decimal;
}[];

type GetAllServicesQuery = {
  take?: string;
  skip?: string;
};

export const getAllServicesSchema: yup.SchemaOf<{ params: GetAllServicesParams; query: GetAllServicesQuery }> =
  yup.object({
    params: yup.object().shape({
      moduleId: yup.string().required('Module id is required'),
    }),
    query: yup.object().concat(paginationSchema),
  });

const getAllServices: RequestHandler<
  GetAllServicesParams,
  GetAllServicesResponse,
  GetAllServicesRequestBody,
  GetAllServicesQuery
> = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const data = await prisma.services.findMany({
      where: {
        ModuleID: { equals: Number(moduleId) },
      },
      select: {
        id: true,
        ServiceName: true,
        ServiceDescription: true,
        ServicePrice: true,
      },
      ...spreadPaginationParams(req.query),
    });

    createSuccessResponse(req, res, data, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllServices;

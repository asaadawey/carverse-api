import { RequestHandler } from 'express';
import { paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';

//#region GetAllServices
type GetAllServicesParams = {
  moduleId: string;
};

type GetAllServicesRequestBody = {};

type GetAllServicesResponse = {
  id: number;
  ServiceName: string;
  ServiceDescription: string;
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
    const data = await req.prisma.services.findMany({
      where: {
        ModuleID: { equals: Number(moduleId) },
      },
      select: {
        id: true,
        ServiceName: true,
        ServiceDescription: true,
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

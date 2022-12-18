import { colorGradiants, providerServices, services } from '@prisma/client';
import prisma from 'helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { paginationSchema, spreadPaginationParams } from 'interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'responses';
import * as yup from 'yup';
//#region GetAllServices
type GetAllServicesParams = {
  moduleId: string;
  providerId: string;
};

type GetAllServicesRequestBody = {};

type GetAllServicesResponse = (providerServices & {
  services:
    | (services & {
        colorGradiants: colorGradiants;
      })
    | null;
})[];

type GetAllServicesQuery = {
  take?: string;
  skip?: string;
};

export const getAllServicesSchema: yup.SchemaOf<{ params: GetAllServicesParams; query: GetAllServicesQuery }> =
  yup.object({
    params: yup.object().shape({
      moduleId: yup.string().required('Module id is required'),
      providerId: yup.string().required('provider id  is required'),
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
    const { moduleId, providerId } = req.params;
    const data = await prisma.providerServices.findMany({
      where: {
        AND: [{ ProviderID: { equals: Number(providerId) } }, { services: { ModuleID: { equals: Number(moduleId) } } }],
      },
      ...spreadPaginationParams(req.query),
      include: {
        services: { include: { colorGradiants: true } },
      },
    });

    createSuccessResponse(req, res, data, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllServices;

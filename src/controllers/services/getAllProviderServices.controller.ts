import { colorGradiants, providerServices, services } from '@prisma/client';
import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { paginationSchema, spreadPaginationParams } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
//#region GetAllProviderServices
type GetAllProviderServicesParams = {
  moduleId: string;
  providerId: string;
};

type GetAllProviderServicesRequestBody = {};

type GetAllProviderServicesResponse = (providerServices & {
  services:
    | (services & {
        colorGradiants: colorGradiants | null;
      })
    | null;
})[];

type GetAllProviderServicesQuery = {
  take?: string;
  skip?: string;
};

export const getAllProviderServicesSchema: yup.SchemaOf<{
  params: GetAllProviderServicesParams;
  query: GetAllProviderServicesQuery;
}> = yup.object({
  params: yup.object().shape({
    moduleId: yup.string().required('Module id is required'),
    providerId: yup.string().required('provider id  is required'),
  }),
  query: yup.object().concat(paginationSchema),
});

const getAllProviderServices: RequestHandler<
  GetAllProviderServicesParams,
  GetAllProviderServicesResponse,
  GetAllProviderServicesRequestBody,
  GetAllProviderServicesQuery
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

export default getAllProviderServices;

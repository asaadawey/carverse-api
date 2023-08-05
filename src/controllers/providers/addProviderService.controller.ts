import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import { ResultResponse } from 'src/interfaces/express.types';
//#region AddProviderService
type AddProviderServiceParams = {
  moduleId: string;
};

type AddProviderServicesRequestBody = {
  serviceId?: number;
  servicePrice: number;
  serviceName?: string;
  serviceDescription?: string;
};

type AddProviderServicesResponse = ResultResponse;

type AddProviderServiceQuery = {};

export const AddProviderServiceSchema: yup.SchemaOf<{
  body: AddProviderServicesRequestBody;
  params: AddProviderServiceParams;
}> = yup.object({
  body: yup.object().shape({
    serviceDescription: yup.string().optional(),
    serviceId: yup.number().optional(),
    serviceName: yup.string().optional(),
    servicePrice: yup.number().required(),
  }),
  params: yup.object().shape({
    moduleId: yup.string().required('Module id required'),
  }),
});

const addProviderService: RequestHandler<
  AddProviderServiceParams,
  AddProviderServicesResponse,
  AddProviderServicesRequestBody,
  AddProviderServiceQuery
> = async (req, res, next) => {
  const { moduleId } = req.params;
  const { servicePrice, serviceDescription, serviceId, serviceName } = req.body;

  try {
    const createdProviderServices = await prisma.providerServices.create({
      data: {
        Price: servicePrice,
        provider: {
          connect: {
            UserID: req.userId,
          },
        },
        services: {
          connectOrCreate: {
            where: {
              id: serviceId,
            },
            create: {
              ServiceDescription: serviceDescription || '',
              ServiceIconLink: '',
              ServiceName: serviceName || '',
              modules: {
                connect: { id: Number(moduleId) },
              },
            },
          },
        },
      },
    });

    createSuccessResponse(req, res, { result: Boolean(createdProviderServices) }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default addProviderService;

import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { ResultResponse } from '@src/interfaces/express.types';

//#region AddProviderService
type upsertProviderServiceParams = {};

type upsertProviderServicesRequestBody = {
  serviceId?: number;
  toCreateServicesBodyTypes: {
    bodyTypeId: number;
    price: number;
  }[];
  toUpdateServices: {
    providerServiceBodyTypeId: number;
    price: number;
  }[];
  providerServicesBodyTypeToRemove?: number[];
  providerServicesToRemove?: number[];
};

type upsertProviderServicesResponse = ResultResponse;

type upsertProvideServiceQuery = {};

export const upsertProviderServiceschema: yup.SchemaOf<{
  body: upsertProviderServicesRequestBody;
  params: upsertProviderServiceParams;
}> = yup.object({
  body: yup
    .object()
    .shape({
      serviceId: yup.number().optional(),
      toCreateServicesBodyTypes: yup
        .array()
        .of(
          yup.object({
            bodyTypeId: yup.number().required().min(1),
            price: yup.number().required().min(1),
          }),
        )
        .min(1),
      toUpdateServices: yup
        .array()
        .of(
          yup.object({
            providerServiceBodyTypeId: yup.number().required().min(1),
            price: yup.number().required().min(1),
          }),
        )
        .min(1),
      providerServicesBodyTypeToRemove: yup.array().of(yup.number().min(1)).optional().min(1),
      providerServicesToRemove: yup.array().of(yup.number().min(1)).optional().min(1),
    })
    .test((body) => {
      if (
        !body.providerServicesBodyTypeToRemove &&
        !body.providerServicesToRemove &&
        !body.toCreateServicesBodyTypes &&
        !body.toUpdateServices
      )
        return false;
      return true;
    }),
  params: yup.object(),
});

const addProviderService: RequestHandler<
  upsertProviderServiceParams,
  upsertProviderServicesResponse,
  upsertProviderServicesRequestBody,
  upsertProvideServiceQuery
> = async (req, res, next) => {
  const {
    toCreateServicesBodyTypes,
    providerServicesBodyTypeToRemove,
    providerServicesToRemove,
    serviceId,
    toUpdateServices,
  } = req.body;

  let createdOrUpdatedId: number = -1;

  try {
    if (toCreateServicesBodyTypes && serviceId) {
      const isProviderHaveService = await req.prisma.providerServices.findFirst({
        where: { ServiceID: serviceId },
        select: { id: true },
      });

      if (isProviderHaveService?.id) {
        const result = await req.prisma.providerServicesAllowedBodyTypes.createManyAndReturn({
          data: toCreateServicesBodyTypes.map((body) => ({
            BodyTypeID: body.bodyTypeId,
            Price: body.price,
            ProviderServiceID: isProviderHaveService.id,
          })),
          select: { id: true },
        });
        createdOrUpdatedId = result as any;
      } else {
        const result = await req.prisma.providerServices.create({
          data: {
            ServiceID: serviceId,
            ProviderID: req.user.providerId,
            providerServicesAllowedBodyTypes: {
              create: toCreateServicesBodyTypes.map((body) => ({
                BodyTypeID: body.bodyTypeId,
                Price: body.price,
              })),
            },
          },
          select: {
            id: true,
          },
        });

        createdOrUpdatedId = result.id;
      }
    }
    if (providerServicesToRemove) {
      const result = await req.prisma.providerServices.deleteMany({ where: { id: { in: providerServicesToRemove } } });
      createdOrUpdatedId = result.count;
    }

    if (providerServicesBodyTypeToRemove) {
      const result = await req.prisma.providerServicesAllowedBodyTypes.deleteMany({
        where: { id: { in: providerServicesBodyTypeToRemove } },
      });
      createdOrUpdatedId = result.count;
    }

    if (toUpdateServices) {
      for (let service of toUpdateServices) {
        const result = await req.prisma.providerServicesAllowedBodyTypes.update({
          where: {
            id: service.providerServiceBodyTypeId,
          },
          data: {
            Price: service.price,
          },
          select: { id: true },
        });
        createdOrUpdatedId = result.id;
      }
    }

    createSuccessResponse(
      req,
      res,
      {
        result: createdOrUpdatedId !== -1,
        createdItemId: createdOrUpdatedId,
      },
      next,
    );
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default addProviderService;

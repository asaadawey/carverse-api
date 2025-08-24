import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { ResultResponse } from '@src/interfaces/express.types';
import logger, { loggerUtils } from '@src/utils/logger';
import { clearCacheByProviderId } from '@src/middleware/cache.middleware';

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

type upsertProviderServicesResponse = ResultResponse & { removedCount?: number };

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

  let removedCount = -1;
  let createdOrUpdatedId: number = -1;

  try {
    req.logger.info('Provider service upsert initiated', {
      providerId: req.user?.providerId,
      serviceId,
      createCount: toCreateServicesBodyTypes?.length || 0,
      updateCount: toUpdateServices?.length || 0,
      removeCount: (providerServicesBodyTypeToRemove?.length || 0) + (providerServicesToRemove?.length || 0),
    });
    if (toCreateServicesBodyTypes && serviceId) {
      const isProviderHaveService = await req.prisma.providerServices.findFirst({
        where: { AND: [{ ProviderID: { equals: req.user?.providerId } }, { ServiceID: serviceId }] },
        select: { id: true },
      });
      console.log('isProviderHaveService', isProviderHaveService, req.user?.providerId, serviceId);
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
      const onesWillBeRemoved = await req.prisma.providerServicesAllowedBodyTypes.findMany({
        where: { id: { in: providerServicesBodyTypeToRemove } },
        select: { id: true, ProviderServiceID: true },
      });
      const result = await req.prisma.providerServicesAllowedBodyTypes.deleteMany({
        where: { id: { in: providerServicesBodyTypeToRemove } },
      });

      // Check if we need to remove the service if all body types are removed
      if (onesWillBeRemoved.length > 0) {
        for (const item of onesWillBeRemoved) {
          const count = await req.prisma.providerServicesAllowedBodyTypes.count({
            where: { ProviderServiceID: item.ProviderServiceID },
          });
          if (count === 0) {
            await req.prisma.providerServices.delete({ where: { id: item.ProviderServiceID } });
          }
        }
      }

      removedCount = result.count;
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

    req.logger.info('Provider service upsert completed successfully', {
      providerId: req.user?.providerId,
      serviceId,
      createdOrUpdatedId,
      wasSuccessful: createdOrUpdatedId !== -1,
    });

    // Clear cache for provider services after successful upsert
    // This clears cache only for the specific provider's cached entries
    if (createdOrUpdatedId !== -1 && req.user?.providerId) {
      const deletedCount = clearCacheByProviderId(req.user.providerId, 'services');
      req.logger.info('Cache cleared for provider services', {
        providerId: req.user.providerId,
        deletedCacheEntries: deletedCount,
      });
    }

    createSuccessResponse(
      req,
      res,
      {
        result: createdOrUpdatedId !== -1,
        createdItemId: createdOrUpdatedId,
        removedCount,
      },
      next,
    );
  } catch (error: any) {
    req.logger.error(error as Error, 'Upsert Provider Service Controller', {
      providerId: req.user?.providerId,
      serviceId,
    });
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default addProviderService;

import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import { ResultResponse } from 'src/interfaces/express.types';
//#region AddProviderService
type upsertProviderServiceParams = {

};

type upsertProviderServicesRequestBody = {
  serviceId?: number;
  providerServiceId?: number;
  servicePrice?: number;
  isDelete?: boolean;
};

type upsertProviderServicesResponse = ResultResponse;

type upsertProvideServiceQuery = {};

export const upsertProviderServiceschema: yup.SchemaOf<{
  body: upsertProviderServicesRequestBody;
  params: upsertProviderServiceParams;
}> = yup.object({
  body: yup.object().shape({
    serviceId: yup.number().optional(),
    providerServiceId: yup.number().optional(),
    servicePrice: yup.number().optional(),
    isDelete: yup.bool().optional().oneOf([true, false])
  }).test({
    message: "wrong delete params",
    test: (params) => {
      if (params.isDelete)
        return Object.keys(params).length === 2 && Boolean(params.providerServiceId);
      return true;
    }
  }).test({
    message: "wrong upsert params",
    test: (params) => {
      if (params.providerServiceId && params.isDelete === undefined)
        return (Boolean(params.servicePrice) || Boolean(params.isDelete));
      return true;
    }
  }).test({
    message: "wrong insert params",
    test: (params) => {
      if (params.serviceId)
        return Object.keys(params).length === 2 && Boolean(params.servicePrice);
      return true;
    }
  }),
  params: yup.object()
});

const addProviderService: RequestHandler<
  upsertProviderServiceParams,
  upsertProviderServicesResponse,
  upsertProviderServicesRequestBody,
  upsertProvideServiceQuery
> = async (req, res, next) => {
  const { servicePrice, serviceId, isDelete, providerServiceId } = req.body;

  let createdOrUpdatedId: number;

  try {
    if (isDelete === true || isDelete === false) {
      await req.prisma.providerServices.update({
        where: {
          id: providerServiceId,
        },
        data: {
          isActive: !isDelete
        },

      })
      createdOrUpdatedId = providerServiceId as number;
    } else {
      const createdProviderServices = await req.prisma.providerServices.upsert({
        where: {
          id: providerServiceId || -1
        },
        update: {
          Price: servicePrice,
        },
        create: {
          Price: servicePrice,
          ServiceID: serviceId,

          ProviderID: req.user.providerId
        },
        select: {
          id: true
        }
      });
      createdOrUpdatedId = createdProviderServices.id
    }

    createSuccessResponse(req, res, {
      result: true,
      createdItemId: createdOrUpdatedId
    }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default addProviderService;

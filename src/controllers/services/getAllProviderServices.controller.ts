import { providerServices, providerServicesAllowedBodyTypes, services } from '@prisma/client';
import { RequestHandler } from 'express';
import { paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { HttpException } from '@src/errors/index';
import { HTTPErrorMessages, HTTPResponses } from '@src/interfaces/enums';
//#region GetAllProviderServices
type GetAllProviderServicesParams = {
  moduleId: string;
  providerId?: string;
};

type GetAllProviderServicesRequestBody = {};

type GetAllProviderServicesResponse = (providerServices & {
  services:
    | (services & {
        isAvailableForAutoSelect: boolean;
        minimumServicePrice: number;
        maximumServicePrice: number;
        averageServicePrice: number;
      })
    | null;
  providerServicesAllowedBodyTypes: providerServicesAllowedBodyTypes[];
})[];

type GetAllProviderServicesQuery = {
  take?: string;
  skip?: string;
  bodyTypeId?: string; // New optional query parameter
};

export const getAllProviderServicesSchema: yup.SchemaOf<{
  params: GetAllProviderServicesParams;
  query: GetAllProviderServicesQuery;
}> = yup.object({
  params: yup.object().shape({
    moduleId: yup.string().required('Module id is required'),
    providerId: yup.string().optional(),
  }),
  query: yup
    .object()
    .shape({
      bodyTypeId: yup.string().optional(), // Validation for the new query parameter
    })
    .concat(paginationSchema),
});

const getAllProviderServices: RequestHandler<
  GetAllProviderServicesParams,
  GetAllProviderServicesResponse,
  GetAllProviderServicesRequestBody,
  GetAllProviderServicesQuery
> = async (req, res, next) => {
  try {
    let { moduleId, providerId } = req.params;
    const { bodyTypeId } = req.query; // Extract the new query parameter

    // Authorization logic
    if (req.user.userType === 'Provider') {
      if (Number(providerId) != req.user.providerId)
        throw new HttpException(
          HTTPResponses.Unauthorised,
          HTTPErrorMessages.NoSufficientPermissions,
          'Unauthorised access to another provider',
        );
    }

    const data = await req.prisma.providerServices.findMany({
      where: {
        AND: [
          { ProviderID: { equals: Number(providerId) } },
          { services: { ModuleID: { equals: Number(moduleId) } } },
          bodyTypeId
            ? { providerServicesAllowedBodyTypes: { some: { BodyTypeID: { equals: Number(bodyTypeId) } } } }
            : {},
        ],
      },
      ...spreadPaginationParams(req.query),
      include: {
        providerServicesAllowedBodyTypes: {
          include: {
            bodyType: true,
          },
        },
        services: true,
      },
    });

    // Transform data to include price calculations and isAvailableForAutoSelect
    const transformedData = data.map((providerService) => {
      if (!providerService.services) {
        return {
          ...providerService,
          services: null,
        };
      }

      // Calculate price statistics from providerServicesAllowedBodyTypes
      const prices = providerService.providerServicesAllowedBodyTypes.map((bodyType) => Number(bodyType.Price));

      let minimumServicePrice = 0;
      let maximumServicePrice = 0;
      let averageServicePrice = 0;

      if (prices.length > 0) {
        minimumServicePrice = Math.min(...prices);
        maximumServicePrice = Math.max(...prices);
        averageServicePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      }

      return {
        ...providerService,
        services: {
          ...providerService.services,
          isAvailableForAutoSelect: providerService.services.isAvailableForAutoSelect,
          minimumServicePrice,
          maximumServicePrice,
          averageServicePrice: Math.round(averageServicePrice * 100) / 100, // Round to 2 decimal places
        },
      };
    });

    return createSuccessResponse(req, res, transformedData, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllProviderServices;

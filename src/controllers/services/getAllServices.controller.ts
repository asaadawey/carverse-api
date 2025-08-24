import { RequestHandler } from 'express';
import { paginationSchema, PaginatorQueryParamsProps, spreadPaginationParams } from '@src/interfaces/express.types';
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
  isAvailableForAutoSelect: boolean;
  priceStats: {
    min: number | null;
    max: number | null;
    avg: number | null;
  };
}[];

type GetAllServicesQuery = PaginatorQueryParamsProps & {
  isAvailableForAutoSelect?: string; // Optional query parameter to filter services
};

export const getAllServicesSchema: yup.SchemaOf<{ params: GetAllServicesParams; query: GetAllServicesQuery }> =
  yup.object({
    params: yup.object().shape({
      moduleId: yup.string().required('Module id is required'),
    }),
    query: yup.object().concat(paginationSchema).shape({
      isAvailableForAutoSelect: yup.string().optional(),
    }),
  });

const getAllServices: RequestHandler<
  GetAllServicesParams,
  GetAllServicesResponse,
  GetAllServicesRequestBody,
  GetAllServicesQuery
> = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    // Fetch basic service data
    const services = await req.prisma.services.findMany({
      where: {
        AND: [
          { ModuleID: { equals: Number(moduleId) } },
          req.query.isAvailableForAutoSelect !== undefined
            ? { isAvailableForAutoSelect: { equals: req.query.isAvailableForAutoSelect === 'true' } }
            : {},
        ],
      },
      select: {
        id: true,
        ServiceName: true,
        ServiceDescription: true,
        isAvailableForAutoSelect: true,
      },
      ...spreadPaginationParams(req.query),
    });

    // For each service compute min/max/avg price from providerServicesAllowedBodyType
    const servicesWithPriceStats = await Promise.all(
      services.map(async (svc) => {
        const agg = await req.prisma.providerServicesAllowedBodyTypes.aggregate({
          where: { providerService: { ServiceID: svc.id } },
          _min: { Price: true },
          _max: { Price: true },
          _avg: { Price: true },
        });

        const min = agg._min?.Price != null ? Number(agg._min.Price) : null;
        const max = agg._max?.Price != null ? Number(agg._max.Price) : null;
        const avg = agg._avg?.Price != null ? Number(Number(agg._avg.Price).toFixed(2)) : null;

        return {
          ...svc,
          priceStats: {
            min,
            max,
            avg,
          },
        };
      }),
    );

    createSuccessResponse(req, res, servicesWithPriceStats, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllServices;

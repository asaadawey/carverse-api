import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import _ from 'lodash';
//#region GetOneProvider
type GetOneProviderParams = { id: string };

type GetOneProvidersRequestBody = {};

type GetOneProvidersResponse = {
  id: number;
  ratingsAverage: string;
  ratingNumber: number;
  users: {
    id: number;
    FirstName: string;
    LastName: string;
  };
  providerServices: {
    services: {
      ServiceName: string;
      ServiceDescription: string;
      ServiceIconLink: string;
    } | null;
  }[];
} | null;

type GetOneProviderQuery = {};

export const getOneProviderSchema: yup.SchemaOf<{ params: GetOneProviderParams }> = yup.object({
  params: yup.object().shape({
    id: yup.string().required(),
  }),
});

const getOneProvider: RequestHandler<
  GetOneProviderParams,
  GetOneProvidersResponse,
  GetOneProvidersRequestBody,
  GetOneProviderQuery
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await req.prisma.provider.findFirst({
      where: {
        OR: [{ UserID: { equals: Number(id) } }, { id: { equals: Number(id) } }],
      },
      select: {
        orders: {
          select: {
            ratings: {
              select: {
                Rating: true,
              },
            },
          },
        },
        id: true,
        users: { select: { FirstName: true, LastName: true, id: true } },
        providerServices: {
          select: {
            services: {
              select: {
                ServiceName: true,
                ServiceIconLink: true,
                ServiceDescription: true,
              },
            },
          },
        },
      },
    });

    let finalResponse: GetOneProvidersResponse | null = null;

    if (provider) {
      const ratingNumber = provider.orders.filter((order) => Boolean(order.ratings?.Rating)).length;
      const allRatings = provider.orders
        .filter((order) => Boolean(order.ratings?.Rating))
        .map((order) => order.ratings?.Rating.toNumber());

      finalResponse = {
        id: provider.id,
        providerServices: provider.providerServices,
        users: provider.users,
        ratingsAverage: (_.sum(allRatings) / ratingNumber).toPrecision(2),
        ratingNumber,
      };
    }

    createSuccessResponse(req, res, finalResponse, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getOneProvider;

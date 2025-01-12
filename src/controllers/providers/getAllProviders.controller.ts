import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import _ from 'lodash';
import * as yup from 'yup';

//#region GetAllProviders
type GetAllProvidersParams = {};

type GetAllProvidersRequestBody = {};

type GetAllProvidersResponse = ({ id: number } & { ratingsAverage: string; ratingNumber: number } & {
  users: { FirstName: string; LastName: string; id: number };
})[];

type GetAllProvidersQuery = PaginatorQueryParamsProps & {
  avg: string;
  ids?: string;
};

export const getAllProvidersSchema: yup.SchemaOf<{}> = yup.object({
  query: yup
    .object()
    .shape({
      avg: yup.string().optional().oneOf(['true', 'false'], 'Wrong value passed to avg'),
      ids: yup.string().required(),
    })
    .concat(paginationSchema),
});

const getAllProviders: RequestHandler<
  GetAllProvidersParams,
  GetAllProvidersResponse,
  GetAllProvidersRequestBody,
  GetAllProvidersQuery
> = async (req, res, next) => {
  try {
    const { ids } = req.query;

    const providers = await req.prisma.provider.findMany({
      ...spreadPaginationParams(req.query),
      ...(ids
        ? {
            where: {
              users: { id: { in: ids.split(',').map(Number) } },
            },
          }
        : {}),
      select: {
        id: true,
        orders: {
          select: {
            ratings: {
              select: {
                Rating: true,
              },
            },
          },
        },
        users: {
          select: { FirstName: true, LastName: true, id: true },
        },
      },
    });

    let response: GetAllProvidersResponse = [];

    providers.forEach((provider) => {
      const ratingNumber = provider.orders?.filter?.((order) => Boolean(order.ratings?.Rating)).length;
      const allRatings = provider.orders
        ?.filter?.((order) => Boolean(order.ratings?.Rating))
        .map((order) => order.ratings?.Rating.toNumber());

      response.push({
        id: provider.id,
        users: provider.users,
        ratingNumber,
        ratingsAverage: (_.sum(allRatings) / ratingNumber).toPrecision(2),
      });
    });

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllProviders;

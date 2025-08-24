import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import _ from 'lodash';
import * as yup from 'yup';

//#region GetAllProviders
type GetAllProvidersParams = {};

type GetAllProvidersRequestBody = {};

type GetAllProvidersResponse = ({ id: number } & {
  feedbacks: { feedback?: string; rating?: number }[];
  ratingsAverage?: string;
  ratingNumber?: number;
} & {
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
              id: { in: ids.split(',').map(Number) },
            },
          }
        : {}),
      select: {
        id: true,
        orders: {
          select: {
            ratings: {
              select: {
                Feedback: true,
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
      const allRatings = provider.orders
        ?.filter?.((order) => Boolean(order.ratings?.Rating))
        .map((order) => order.ratings?.Rating.toNumber());

      const totalFeedbacks = provider.orders
        // .filter((order) => Boolean(order.ratings?.Feedback))
        .map((order) => ({
          feedback: order.ratings?.Feedback ?? undefined,
          rating: order.ratings?.Rating?.toNumber(),
        }));

      response.push({
        id: provider.id,
        users: provider.users,
        feedbacks: totalFeedbacks,
        ratingNumber: totalFeedbacks?.length ?? 0,
        ratingsAverage: (_.sum(allRatings) / (allRatings?.length || 1)).toPrecision(2),
      });
    });

    createSuccessResponse(req, res, response, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllProviders;

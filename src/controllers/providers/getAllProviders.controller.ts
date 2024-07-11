import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
// import * as _ from 'lodash';
import * as yup from 'yup';

//#region GetAllProviders
type GetAllProvidersParams = {};

type GetAllProvidersRequestBody = {};

type GetAllProvidersResponse = (({ id: number; NumberOfOrders: number } & { avg?: number }) & {
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

    const providers: GetAllProvidersResponse = await req.prisma.provider.findMany({
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
        NumberOfOrders: true,

        users: {
          select: { FirstName: true, LastName: true, id: true },
        },
      },
    });

    // if (avg === 'true') {
    //   var i = 0;
    //   //Calculate price average
    //   for (let provider of providers) {
    //     const providerServices = await req.prisma.providerServices.findMany({
    //       where: { ProviderID: { equals: provider.id } },
    //       select: {
    //         // Price: true,
    //         services: {
    //           select: {
    //             ServiceName: true,
    //             ServiceDescription: true,
    //             ServiceIconLink: true,
    //           },
    //         },
    //       },
    //     });
    //     // const sum = _.sumBy(providerServices, (a) => Number(a.Price) as any);
    //     providers[Number(i)] = {
    //       ...provider,
    //       // avg: sum / providerServices.length,
    //     };
    //     i++;
    //   }
    // }
    createSuccessResponse(req, res, [...providers], next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllProviders;

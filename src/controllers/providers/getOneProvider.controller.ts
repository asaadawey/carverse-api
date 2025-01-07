import { RequestHandler } from 'express';
import * as yup from 'yup';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import { colorGradiants } from '@prisma/client';
//#region GetOneProvider
type GetOneProviderParams = { id: string };

type GetOneProvidersRequestBody = {};

type GetOneProvidersResponse = {
  id: number;
  users: {
    id: number;
    FirstName: string;
    LastName: string;
  };
  ordersCount?: number | undefined;
  providerServices: {
    services: {
      ServiceName: string;
      colorGradiants: colorGradiants;
      ServiceIconLink: string;
      ServiceDescription: string;
    } | null;
  }[];
};

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
    const [provider, ordersCount] = await Promise.all([
      req.prisma.provider.findFirst({
        where: {
          OR: [{ UserID: { equals: Number(id) } }, { id: { equals: Number(id) } }],
        },
        select: {
          id: true,
          users: { select: { FirstName: true, LastName: true, id: true } },
          providerServices: {
            select: {
              services: {
                select: {
                  ServiceName: true,
                  colorGradiants: true,
                  ServiceIconLink: true,
                  ServiceDescription: true,
                },
              },
            },
          },
        },
      }),
      req.prisma.orders.count({
        where: { ProviderID: Number(id) },
      }),
    ]);
    //@ts-ignore
    createSuccessResponse(req, res, { ...provider, ...(provider ? { ordersCount } : {}) }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getOneProvider;

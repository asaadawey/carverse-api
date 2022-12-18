import prisma from 'helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { paginationSchema } from 'interfaces/express.types';
import * as yup from 'yup';
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
  ordersCount: number;
  providerServices: {
    services: {
      ServiceName: string;
      ServiceIconLink: string;
      ServiceDescription: string;
    } | null;
  }[];
};

type GetOneProviderQuery = {};

export const getAllProvidersSchema: yup.SchemaOf<{}> = yup.object({
  query: yup
    .object()
    .shape({
      avg: yup.string().optional().oneOf(['true', 'false'], 'Wrong value passed to avg'),
    })
    .concat(paginationSchema),
});

const getOneProvider: RequestHandler<
  GetOneProviderParams,
  GetOneProvidersResponse,
  GetOneProvidersRequestBody,
  GetOneProviderQuery
> = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [{ UserID: { equals: Number(id) } }, { id: { equals: Number(id) } }],
      },
      select: {
        id: true,
        users: { select: { FirstName: true, LastName: true, id: true } },
        providerServices: { select: { services: true } },
      },
    });

    const ordersCount = await prisma.orders.count({
      where: { ProviderID: parseInt(id) },
    });

    if (provider && ordersCount !== undefined) res.status(200).json({ ...provider, ordersCount });
    else res.status(401);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

export default getOneProvider;

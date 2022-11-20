import { provider, services, users } from "@prisma/client";
import { RequestHandler } from "express";
import * as _ from "lodash";
import prismaClient from "../../prisma/client";

const prisma = prismaClient;

//#region GetAllProviders
type GetAllProvidersLinkQuery = {};

type GetAllProvidersRequestBody = {};

type GetAllProvidersResponse = ((provider & { avg?: number }) & {
  users: users;
})[];

type GetAllProvidersQueryParams = {
  take: string;
  skip: string;
  details: string;
};

export const getAllProviders: RequestHandler<
  GetAllProvidersLinkQuery,
  GetAllProvidersResponse,
  GetAllProvidersRequestBody,
  GetAllProvidersQueryParams
> = async (req, res, next) => {
  try {
    const { skip, take, details } = req.query;
    const providers: GetAllProvidersResponse = await prisma.provider.findMany({
      take: parseInt(take),
      skip: parseInt(skip),
      include: {
        users: true,
      },
    });

    if (details === "true") {
      //Calculate price average
      providers.forEach(async (provider, id) => {
        const providerServices = await prisma.providerServices.findMany({
          where: { ProviderID: { equals: provider.id } },
        });

        providers[id] = {
          ...provider,
          avg:
            _.sumBy(providerServices, (a) => a.Price as any) /
            providerServices.length,
        };
      });
    }

    res.status(200).json(providers);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

//#region GetOneProvider
type GetOneProviderLinkQuery = {};

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
    services: services | null;
  }[];
};

type GetOneProviderQueryParams = { id: string };

export const getOneProvider: RequestHandler<
  GetOneProviderLinkQuery,
  GetOneProvidersResponse,
  GetOneProvidersRequestBody,
  GetOneProviderQueryParams
> = async (req, res, next) => {
  try {
    const { id } = req.query;
    const provider = await prisma.provider.findFirst({
      where: {
        OR: [
          { UserID: { equals: Number(id) } },
          { id: { equals: Number(id) } },
        ],
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
    console.log({ provider, ordersCount });
    if (provider && ordersCount !== undefined)
      res.status(200).json({ ...provider, ordersCount });
    else res.status(401);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

//#region GetRightProviders
type GetRightProvidersLinkQuery = {};

type GetRightProvidersRequest = {
  onlineUsersIds: number[];
  selectedTime: Date | "now";
};

type GetRightProvidersResponse = {
  users: {
    FirstName: string;
    LastName: string;
  };
  NumberOfOrders: number;
}[];

type GetRightProvidersQueryParams = {};

export const getRightProviders: RequestHandler<
  GetRightProvidersLinkQuery,
  GetRightProvidersResponse,
  GetRightProvidersRequest,
  GetRightProvidersQueryParams
> = async (req, res, next) => {
  try {
    // const provider = await prisma.provider.findMany({
    //   where: {
    //     AND: [
    //       { id: { in: req.body.onlineUsersIds } },
    //       req.body.selectedTime === "now"
    //         ? {}
    //         : {
    //             AND: [
    //               {
    //                 providerAvailableTimes: {
    //                   some: { From: { gte: req.body.selectedTime } },
    //                 },
    //               },
    //               {
    //                 providerAvailableTimes: {
    //                   some: { To: { lte: req.body.selectedTime } },
    //                 },
    //               },
    //             ],
    //           },
    //     ],
    //   },
    //   select: {
    //     NumberOfOrders: true,
    //     users: { select: { FirstName: true, LastName: true } },
    //   },
    // });
    // res.status(200).json(provider);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

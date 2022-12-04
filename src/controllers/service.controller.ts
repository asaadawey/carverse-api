import { colorGradiants, providerServices, services } from '.prisma/client';
import { RequestHandler } from 'express';
import prismaClient from 'databaseHelpers/client';

const prisma = prismaClient;

//#region GetAllServices
type GetAllServicesLinkQuery = {};

type GetAllServicesRequestBody = {};

type GetAllServicesResponse = (providerServices & {
  services:
    | (services & {
        colorGradiants: colorGradiants;
      })
    | null;
})[];

type GetAllServicesQueryParams = {
  ModuleID: string;
  ProviderID: string;
  take: string;
  skip: string;
};

export const getAllServices: RequestHandler<
  GetAllServicesLinkQuery,
  GetAllServicesResponse,
  GetAllServicesRequestBody,
  GetAllServicesQueryParams
> = async (req, res, next) => {
  try {
    const { ModuleID, skip, take, ProviderID } = req.query;
    let data = await prisma.providerServices.findMany({
      where: {
        AND: [{ ProviderID: { equals: Number(ProviderID) } }, { services: { ModuleID: { equals: Number(ModuleID) } } }],
      },
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      include: {
        services: { include: { colorGradiants: true } },
      },
    });
    res.status(201).json(data);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

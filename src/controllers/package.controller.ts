import { colorGradiants, packages, services } from '.prisma/client';
import { RequestHandler } from 'express';
import prismaClient from 'databaseHelpers/client';

const prisma = prismaClient;

//#region GetAllPackages
export type GetAllPackagesLinkQuery = {};

export type GetAllPackagesRequest = {};

export type GetAllPackagesResponse = {} & (Omit<packages, 'CreatedOn' | 'GradiantID'> & {
  colorGradiants: colorGradiants;
  packageServices: {
    services: services & { colorGradiants: colorGradiants };
  }[];
})[];

export type GetAllPackagesQueryParams = {
  ModuleID: string;
};

export const getAllPackages: RequestHandler<
  GetAllPackagesLinkQuery,
  GetAllPackagesResponse,
  GetAllPackagesRequest,
  GetAllPackagesQueryParams
> = async (req, res, next) => {
  try {
    const { ModuleID } = req.query;
    const data = await prisma.packages.findMany({
      where: { ModuleID: { equals: parseInt(ModuleID) } },
      select: {
        id: true,
        ModuleID: true,
        PackagePrice: true,
        PackageName: true,
        PackageDescription: true,
        PackageOriginalPrice: true,
        colorGradiants: true,
        PackageIconLink: true,
        packageServices: {
          select: { services: { include: { colorGradiants: true } } },
        },
      },
    });

    res.status(201).json(data);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

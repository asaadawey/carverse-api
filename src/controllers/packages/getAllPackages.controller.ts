import { colorGradiants, packages, services } from '@prisma/client';
import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region GetAllPackages
export type GetAllPackagesParams = { moduleId: string };

export type GetAllPackagesRequest = {};

export type GetAllPackagesResponse = {} & (Omit<packages, 'CreatedOn' | 'GradiantID'> & {
  colorGradiants: colorGradiants;
  packageServices: {
    services: services & { colorGradiants: colorGradiants };
  }[];
})[];

export type GetAllPackagesQuery = {};

export const getAllPackagesSchema: yup.SchemaOf<{ params: GetAllPackagesParams }> = yup.object({
  params: yup.object({
    moduleId: yup.string().min(1).required(),
  }),
});
const getAllPackages: RequestHandler<
  GetAllPackagesParams,
  GetAllPackagesResponse,
  GetAllPackagesRequest,
  GetAllPackagesQuery
> = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const data = await prisma.packages.findMany({
      where: { ModuleID: { equals: Number(moduleId) } },
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
    createSuccessResponse(req, res, data || [], next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getAllPackages;

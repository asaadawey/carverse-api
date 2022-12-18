import prisma from 'helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from 'interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'responses';
import * as yup from 'yup';
//#region GetAllCars
type GetAllCarsLinkQuery = {};

type GetAllCarsRequestBody = {};

type GetAllCarsResponse = {
  id: number;
  Color: string;
  Manufacturer: string;
  Model: string;
  // PlateCity: string;
  PlateNumber: string;

  bodyTypes: {
    TypeName: string;
  };
}[];

type GetAllCarsQueryParams = PaginatorQueryParamsProps;

export const getAllCarsSchema: yup.SchemaOf<{}> = yup.object({
  query: yup.object().concat(paginationSchema),
});

const getAllCars: RequestHandler<
  GetAllCarsLinkQuery,
  GetAllCarsResponse,
  GetAllCarsRequestBody,
  GetAllCarsQueryParams
> = async (req, res, next) => {
  try {
    const cars = await prisma.cars.findMany({
      ...spreadPaginationParams(req.query),
      where: { UserID: Number(req.userId) },
      select: {
        id: true,
        bodyTypes: { select: { TypeName: true } },
        Color: true,
        Manufacturer: true,
        Model: true,
        PlateCity: true,
        PlateNumber: true,
      },
    });
    createSuccessResponse(req, res, [...cars], next);
  } catch (err) {
    createFailResponse(req, res, err, next);
  }
};

//#endregion

export default getAllCars;

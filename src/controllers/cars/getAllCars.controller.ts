import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
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
    const cars = await req.prisma.cars.findMany({
      ...spreadPaginationParams(req.query),
      where: { UserID: Number(req.user.id) },
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
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllCars;

import { RequestHandler } from 'express';
import { PaginatorQueryParamsProps, paginationSchema, spreadPaginationParams } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import { HTTPResponses, UserTypes } from '@src/interfaces/enums';
import HttpException from '@src/errors/HttpException';
import { getLocalizedMessage } from '@src/utils/localization';
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
    id: number;
    TypeName: string;
  };
}[];

type GetAllCarsQueryParams = PaginatorQueryParamsProps & { userId?: string };

export const getAllCarsSchema: yup.SchemaOf<{ query: GetAllCarsQueryParams }> = yup.object({
  query: yup
    .object()
    .shape({
      userId: yup.string().optional(),
    })
    .concat(paginationSchema),
});

const getAllCars: RequestHandler<
  GetAllCarsLinkQuery,
  GetAllCarsResponse,
  GetAllCarsRequestBody,
  GetAllCarsQueryParams
> = async (req, res, next) => {
  try {
    let whereClause: Prisma.carsWhereInput = {};

    if (req.user.userType === UserTypes.Admin) {
      if (req.query.userId) {
        whereClause.UserID = Number(req.query.userId);
      }
    } else if (req.user.userType === UserTypes.Customer) {
      whereClause.UserID = Number(req.user.id);
    } else {
      throw new HttpException(
        HTTPResponses.Unauthorised,
        getLocalizedMessage(req, 'error.unauthorized'),
        'Provider cannot access cars',
      );
    }

    const cars = await req.prisma.cars.findMany({
      ...spreadPaginationParams(req.query),
      where: whereClause,
      select: {
        id: true,
        bodyTypes: { select: { TypeName: true, id: true } },
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

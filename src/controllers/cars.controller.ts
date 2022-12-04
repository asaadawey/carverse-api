import { RequestHandler } from 'express';
import prismaClient from 'databaseHelpers/client';
import { PaginatorQueryParamsProps, spreadPaginationParams } from 'interfaces/express.types';
import { ResultResponse } from 'interfaces/routes.types';

const prisma = prismaClient;

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

type GetAllCarsQueryParams = { userId: string } & PaginatorQueryParamsProps;

export const getAllCars: RequestHandler<
  GetAllCarsLinkQuery,
  GetAllCarsResponse,
  GetAllCarsRequestBody,
  GetAllCarsQueryParams
> = async (req, res, next) => {
  try {
    const cars = await prisma.cars.findMany({
      ...spreadPaginationParams(req.query),
      where: { UserID: Number(req.query.userId) || undefined },
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
    res.status(200).json(cars);
  } catch (err) {
    next(err);
  }
};

//#endregion
//#region GetAllBodyTypes
type GetAllBodyTypesLinkQuery = {};

type GetAllBodyTypesRequestBody = {};

type GetAllBodyTypesResponse = {
  TypeName: string;
  id: number;
}[];

type GetAllBodyTypesQueryParams = {};

export const getAllBodyTypes: RequestHandler<
  GetAllBodyTypesLinkQuery,
  GetAllBodyTypesResponse,
  GetAllBodyTypesRequestBody,
  GetAllBodyTypesQueryParams
> = async (req, res, next) => {
  try {
    const bodyTypes = await prisma.bodyTypes.findMany({
      select: { TypeName: true, id: true },
    });
    res.status(200).json(bodyTypes);
  } catch (err) {
    next(err);
  }
};

//#endregion
//#region AddCar
type AddCarLinkQuery = {};

type AddCarRequestBody = {
  UserID: number;
  BodyTypeID: string;
  PlateNumber: string;
  PlateCity: string;
  Color: string;
  Manufacturer: string;
  Model: string;
};

type AddCarResponse = ResultResponse;

type AddCarQueryParams = {};

export const addCar: RequestHandler<AddCarLinkQuery, AddCarResponse, AddCarRequestBody, AddCarQueryParams> = async (
  req,
  res,
  next,
) => {
  try {
    const result = await prisma.cars.create({
      data: {
        UserID: req.body.UserID,
        BodyTypeID: Number(req.body.BodyTypeID),
        Color: req.body.Color,
        Manufacturer: req.body.Manufacturer,
        Model: req.body.Model,
        PlateCity: req.body.PlateCity,
        PlateNumber: req.body.PlateNumber,
      },
      select: { id: true },
    });
    res.status(200).json({ result: Boolean(result.id) });
  } catch (err) {
    next(err);
  }
};

//#endregion
//#region VerifyCarNumber
type VerifyCarNumberLinkQuery = {};

type VerifyCarNumberRequestBody = {
  PlateNumber: string;
};

type VerifyCarNumberResponse = ResultResponse;

type VerifyCarNumberQueryParams = {};

export const verifyCarNumber: RequestHandler<
  VerifyCarNumberLinkQuery,
  VerifyCarNumberResponse,
  VerifyCarNumberRequestBody,
  VerifyCarNumberQueryParams
> = async (req, res, next) => {
  try {
    const result = await prisma.cars.findMany({
      where: { PlateNumber: { equals: req.body.PlateNumber } },
    });
    res.status(200).json({ result: result.length === 0 });
  } catch (err) {
    next(err);
  }
};

//#endregion

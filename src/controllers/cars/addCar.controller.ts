import prisma from 'helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { ResultResponse } from 'interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'responses';
import * as yup from 'yup';
//#region AddCar
type AddCarLinkQuery = {};

type AddCarRequestBody = {
  BodyTypeID: string;
  PlateNumber: string;
  PlateCity: string;
  Color: string;
  Manufacturer: string;
  Model: string;
};

type AddCarResponse = ResultResponse;

type AddCarQueryParams = {};

export const addCarSchema: yup.SchemaOf<{}> = yup.object({
  body: yup.object({
    BodyTypeID: yup.number().required().min(1),
    PlateNumber: yup.string().max(5).required(),
    PlateCity: yup.string().required(),
    Color: yup.string().required(),
    Manufacturer: yup.string().required(),
    Model: yup.string().required(),
  }),
});

const addCar: RequestHandler<AddCarLinkQuery, AddCarResponse, AddCarRequestBody, AddCarQueryParams> = async (
  req,
  res,
  next,
) => {
  try {
    await prisma.cars.create({
      data: {
        UserID: req.userId,
        BodyTypeID: Number(req.body.BodyTypeID),
        Color: req.body.Color,
        Manufacturer: req.body.Manufacturer,
        Model: req.body.Model,
        PlateCity: req.body.PlateCity,
        PlateNumber: req.body.PlateNumber,
      },
      select: { id: true },
    });

    createSuccessResponse(req, res, { result: true }, next);
  } catch (err) {
    createFailResponse(req, res, err, next);
  }
};

//#endregion

export default addCar;

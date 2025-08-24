import { RequestHandler } from 'express';
import { ResultResponse } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
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
    PlateNumber: yup.string().max(8).required(),
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
    const createdCar = await req.prisma.cars.create({
      data: {
        UserID: req.user.id,
        BodyTypeID: Number(req.body.BodyTypeID),
        Color: req.body.Color,
        Manufacturer: req.body.Manufacturer,
        Model: req.body.Model,
        PlateCity: req.body.PlateCity,
        PlateNumber: req.body.PlateNumber,
      },
      select: { id: true },
    });

    createSuccessResponse(req, res, { result: true, createdItemId: createdCar.id }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default addCar;

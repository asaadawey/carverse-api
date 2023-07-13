import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { ResultResponse } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region VerifyCarNumber
type VerifyCarNumberQuery = {};

type VerifyCarNumberRequestBody = {};

type VerifyCarNumberResponse = ResultResponse;

type VerifyCarNumberParams = { plateNumber: string };

export const verifyCarNumberSchema: yup.SchemaOf<{ params: VerifyCarNumberParams }> = yup.object({
  params: yup.object({
    plateNumber: yup.string().min(1).required(),
  }),
});

const verifyCarNumber: RequestHandler<
  VerifyCarNumberParams,
  VerifyCarNumberResponse,
  VerifyCarNumberRequestBody,
  VerifyCarNumberQuery
> = async (req, res, next) => {
  try {
    const result = await prisma.cars.findMany({
      where: { PlateNumber: { equals: req.params.plateNumber } },
    });
    createSuccessResponse(req, res, { result: result?.length > 0 }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default verifyCarNumber;

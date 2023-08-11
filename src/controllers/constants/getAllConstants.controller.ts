import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { Decimal } from '@prisma/client/runtime/library';

//#region GetAllConstants
type GetAllConstantsLinkQuery = {};

type GetAllConstantsRequestBody = {};

type GetAllConstantsResponse = {
  Name: string;
  Value: Decimal;
  Type: string;
}[];

type GetAllConstantsQueryParams = {};

export const getAllConstantsSchema: yup.SchemaOf<{}> = yup.object({});

const getAllConstants: RequestHandler<
  GetAllConstantsLinkQuery,
  GetAllConstantsResponse,
  GetAllConstantsRequestBody,
  GetAllConstantsQueryParams
> = async (req, res, next) => {
  try {
    const constants = await prisma.constants.findMany({
      where: { isActive: { equals: true } },
      select: { Name: true, Value: true, Type: true },
    });
    createSuccessResponse(req, res, constants, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllConstants;

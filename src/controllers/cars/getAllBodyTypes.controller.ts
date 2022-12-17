import prisma from 'databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'responses';
import * as yup from 'yup';

//#region GetAllBodyTypes
type GetAllBodyTypesLinkQuery = {};

type GetAllBodyTypesRequestBody = {};

type GetAllBodyTypesResponse = {
  TypeName: string;
  id: number;
}[];

type GetAllBodyTypesQueryParams = {};

export const getAllBodyTypesSchema: yup.SchemaOf<{}> = yup.object({});

const getAllBodyTypes: RequestHandler<
  GetAllBodyTypesLinkQuery,
  GetAllBodyTypesResponse,
  GetAllBodyTypesRequestBody,
  GetAllBodyTypesQueryParams
> = async (req, res, next) => {
  try {
    const bodyTypes = await prisma.bodyTypes.findMany({
      select: { TypeName: true, id: true },
    });
    createSuccessResponse(req, res, bodyTypes, next);
  } catch (err) {
    createFailResponse(req, res, err, next);
  }
};

//#endregion

export default getAllBodyTypes;

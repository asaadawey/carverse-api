import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
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

type GetAllConstantsQueryParams = { name?: string };

export const getAllConstantsSchema: yup.SchemaOf<{ query: GetAllConstantsQueryParams }> = yup.object({
  query: yup.object().shape({
    name: yup.string().optional(),
  }),
});

const getAllConstants: RequestHandler<
  GetAllConstantsLinkQuery,
  GetAllConstantsResponse,
  GetAllConstantsRequestBody,
  GetAllConstantsQueryParams
> = async (req, res, next) => {
  try {
    const { name } = req.query;
    const constants = await req.prisma.constants.findMany({
      where: { isActive: { equals: true }, ...(name && { Name: { in: name.split(',') } }) },
      select: { Name: true, Value: true, Type: true },
    });
    createSuccessResponse(req, res, constants, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllConstants;

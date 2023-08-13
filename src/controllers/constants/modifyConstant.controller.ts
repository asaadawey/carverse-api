import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { ResultResponse } from 'src/interfaces/express.types';

//#region ModifyConstant
type ModifyConstantLinkQuery = {
  constantId: string;
};

type ModifyConstantRequestBody = {
  newValue: number;
  isActive?: boolean;
};

type ModifyConstantResponse = ResultResponse;

type ModifyConstantQueryParams = {};

export const modifyConstantSchema: yup.SchemaOf<{ params: ModifyConstantLinkQuery; body: ModifyConstantRequestBody }> =
  yup.object({
    params: yup.object().shape({
      constantId: yup.string().required(),
    }),
    body: yup.object().shape({
      isActive: yup.boolean().optional(),
      newValue: yup.number().positive().required(),
    }),
  });

const modifyConstant: RequestHandler<
  ModifyConstantLinkQuery,
  ModifyConstantResponse,
  ModifyConstantRequestBody,
  ModifyConstantQueryParams
> = async (req, res, next) => {
  try {
    const { constantId } = req.params;
    const { newValue, isActive } = req.body;

    await prisma.constants.update({
      where: { id: Number(constantId) },
      data: {
        isActive: typeof isActive !== 'undefined' ? isActive : undefined,
        Value: Number(newValue),
      },
    });
    createSuccessResponse(req, res, { result: true }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default modifyConstant;

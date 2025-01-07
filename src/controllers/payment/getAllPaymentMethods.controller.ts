import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';

//#region GetAllPaymentMethods
type GetAllPaymentMethodsLinkQuery = {};

type GetAllPaymentMethodsRequestBody = {};

type GetAllPaymentMethodsResponse = {
  MethodName: string;
  MethodDescription: string;
  id: number;
}[];

type GetAllPaymentMethodsQueryParams = {};

export const getAllPaymentMethodsSchema: yup.SchemaOf<{}> = yup.object({});

const getAllPaymentMethods: RequestHandler<
  GetAllPaymentMethodsLinkQuery,
  GetAllPaymentMethodsResponse,
  GetAllPaymentMethodsRequestBody,
  GetAllPaymentMethodsQueryParams
> = async (req, res, next) => {
  try {
    const paymentMethods = await req.prisma.paymentMethods.findMany({
      select: { MethodName: true, id: true, MethodDescription: true },
    });
    createSuccessResponse(req, res, paymentMethods, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllPaymentMethods;

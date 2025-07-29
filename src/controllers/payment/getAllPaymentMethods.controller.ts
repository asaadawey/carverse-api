import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import logger, { loggerUtils } from '@src/utils/logger';

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
    logger.debug('Fetching all payment methods', { reqId: req.headers['req_id'] });

    const paymentMethods = await req.prisma.paymentMethods.findMany({
      select: { MethodName: true, id: true, MethodDescription: true },
    });

    logger.debug('Payment methods retrieved successfully', {
      count: paymentMethods.length,
      reqId: req.headers['req_id'],
    });

    createSuccessResponse(req, res, paymentMethods, next);
  } catch (error: any) {
    loggerUtils.logError(error as Error, 'Get All Payment Methods Controller', {
      reqId: req.headers['req_id'],
    });
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllPaymentMethods;

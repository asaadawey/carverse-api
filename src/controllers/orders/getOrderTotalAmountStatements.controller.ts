import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import _ from 'lodash';
import { Constants, HTTPErrorString, HTTPResponses, PaymentMethods } from '@src/interfaces/enums';
import { getAmount } from '@src/utils/amountUtils';
import { ConstantType } from '@prisma/client';
import { decrypt, encrypt } from '@src/utils/encrypt';
import { Decimal } from '@prisma/client/runtime/library';
import HttpException from '@src/errors/HttpException';
import { calculateTotalAmount, Statements } from '@src/utils/orderUtils';
import { logger } from '@src/middleware/log.middleware.enhanced';

//#region GetOrderTotalAmountStatements

type GetOrderTotalAmountStatementsLinkQuery = {};

type GetOrderTotalAmountStatementsRequestBody = {};

type GetOrderTotalAmountStatementsResponse = {
  totalAmount: string;
  statements: Statements[];
};

type GetOrderTotalAmountStatementsQueryParams = {
  paymentMethodName: string;
  providerServiceBodyTypesIds?: string;
  autoSelectServiceIds?: string;
  autoSelectProposedServicePrice?: string;
  voucherCode?: string;
};

export const getOrderTotalAmountStatementsSchema: yup.SchemaOf<{ query: GetOrderTotalAmountStatementsQueryParams }> =
  yup.object({
    query: yup
      .object()
      .shape({
        paymentMethodName: yup.string().required(),
        providerServiceBodyTypesIds: yup.string().optional(),
        autoSelectServiceIds: yup.string().optional(),
        autoSelectProposedServicePrice: yup.string().optional(),
        voucherCode: yup.string().optional(),
      })
      .test({
        message: 'Provider service Id or auto select service Ids must be provided',
        test: (value) => {
          if (
            value.providerServiceBodyTypesIds &&
            !value.autoSelectServiceIds &&
            !value.autoSelectProposedServicePrice
          ) {
            return true;
          } else if (
            value.autoSelectServiceIds &&
            value.autoSelectProposedServicePrice &&
            !value.providerServiceBodyTypesIds
          ) {
            return true;
          }
          return false;
        },
      })
      .test({
        message: 'Auto select service Ids and auto select proposed service price cannot be provided together',
        test: (value) => {
          if (
            (value.autoSelectServiceIds && value.providerServiceBodyTypesIds) ||
            (value.providerServiceBodyTypesIds && value.autoSelectProposedServicePrice)
          ) {
            return false;
          }
          return true;
        },
      }),
  });

const getOrderTotalAmountStatements: RequestHandler<
  GetOrderTotalAmountStatementsLinkQuery,
  GetOrderTotalAmountStatementsResponse,
  GetOrderTotalAmountStatementsRequestBody,
  GetOrderTotalAmountStatementsQueryParams
> = async (req, res, next) => {
  try {
    const {
      paymentMethodName,
      providerServiceBodyTypesIds,
      autoSelectProposedServicePrice,
      autoSelectServiceIds,
      voucherCode,
    } = req.query;

    const calculatedStatement = await calculateTotalAmount(
      req.prisma,
      {
        paymentMethodName,
        autoSelectProposedServicePrice,
        autoSelectServiceIds,
        providerServiceBodyTypesIds,
        userId: req.user.id,
        voucherCode,
      },
      logger.info,
    );

    createSuccessResponse(
      req,
      res,
      { statements: calculatedStatement.statements, totalAmount: encrypt('' + calculatedStatement.totalAmount) },
      next,
    );
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getOrderTotalAmountStatements;

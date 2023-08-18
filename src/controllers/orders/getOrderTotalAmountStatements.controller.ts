import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import * as _ from 'lodash';
import { Constants, PaymentMethods } from 'src/interfaces/enums';
import { getAmount } from 'src/utils/amountUtils';
import { ConstantType } from '@prisma/client';
import { decrypt, encrypt } from 'src/utils/encrypt';
import { Decimal } from '@prisma/client/runtime/library';

//#region GetOrderTotalAmountStatements
export type Statements = {
  name: string;
  label: string;
  encryptedValue: string | Decimal;
  relatedProviderServiceId?: number;
  relatedConstantId?: number;
};

type GetOrderTotalAmountStatementsLinkQuery = {};

type GetOrderTotalAmountStatementsRequestBody = {};

type GetOrderTotalAmountStatementsResponse = {
  totalAmount: string;
  statements: Statements[];
};

type GetOrderTotalAmountStatementsQueryParams = { paymentMethodName: string; providerServiceIds: string };

export const getOrderTotalAmountStatementsSchema: yup.SchemaOf<{ query: GetOrderTotalAmountStatementsQueryParams }> =
  yup.object({
    query: yup.object().shape({
      paymentMethodName: yup.string().required(),
      providerServiceIds: yup.string().required(),
    }),
  });

const getOrderTotalAmountStatements: RequestHandler<
  GetOrderTotalAmountStatementsLinkQuery,
  GetOrderTotalAmountStatementsResponse,
  GetOrderTotalAmountStatementsRequestBody,
  GetOrderTotalAmountStatementsQueryParams
> = async (req, res, next) => {
  try {
    const { paymentMethodName, providerServiceIds } = req.query;

    let totalAmount: number = 0;

    let statements: Statements[] = [];

    // Calculate provider services
    const providerServices = await prisma.providerServices.findMany({
      where: {
        id: {
          in: providerServiceIds.split(',').map(Number),
        },
      },
      select: {
        id: true,
        services: {
          select: {
            ServiceName: true,
          },
        },
        Price: true,
      },
    });

    statements = statements.concat(
      providerServices.map((service) => ({
        name: service.services?.ServiceName || '',
        label: service.services?.ServiceName || '',
        encryptedValue: encrypt(String(getAmount(service.Price, ConstantType.Amount, new Decimal(totalAmount)))),
        relatedProviderServiceId: service.id,
      })),
    );

    let constantsToGet = [Constants.VAT, Constants.ServiceCharges];
    if (paymentMethodName === PaymentMethods.Credit) constantsToGet.push(Constants.OnlinePaymentCharges);

    const constants = await prisma.constants.findMany({
      where: {
        AND: [
          {
            Name: {
              in: constantsToGet,
            },
          },
          { isActive: { equals: true } },
        ],
      },
      select: {
        id: true,
        Name: true,
        Label: true,
        Value: true,
        Type: true,
      },
    });

    // Calculate VAT
    const vat = constants.find((value) => value.Name === Constants.VAT) as any;
    totalAmount = _.sumBy(statements, (statement) => Number(decrypt(statement.encryptedValue as string)));
    statements = statements.concat({
      name: vat?.Name || '',
      label: vat?.Label,
      encryptedValue: encrypt(String(getAmount(vat?.Value, vat?.Type, new Decimal(totalAmount)))),
      relatedConstantId: vat?.id,
    });

    const serviceCharges = constants.find((value) => value.Name === Constants.ServiceCharges);
    const onlineCharges = constants.find((value) => value.Name === Constants.OnlinePaymentCharges);

    statements = statements.concat(
      [serviceCharges, onlineCharges].filter(Boolean).map((value: any) => ({
        name: value?.Name || '',
        label: value?.Label,
        encryptedValue: encrypt(String(getAmount(value?.Value || 0, value?.Type, new Decimal(totalAmount)))),
        relatedConstantId: value.id,
      })),
    );

    totalAmount = _.sumBy(statements, (statement) => Number(decrypt(statement.encryptedValue as string)));

    createSuccessResponse(req, res, { statements, totalAmount: encrypt('' + totalAmount) }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getOrderTotalAmountStatements;

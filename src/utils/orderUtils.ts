import { ConstantType, OrderSubmissionType, Prisma, PrismaClient } from '@prisma/client';
import { getAmount } from './amountUtils';
import { Decimal } from '@prisma/client/runtime/library';
import { Constants, HTTPResponses, OrderHistory, PaymentMethods, UserTypes } from '@src/interfaces/enums';
import _ from 'lodash';
import { addSeconds } from 'date-fns';
import { fi, is } from 'date-fns/locale';
import { Token } from '@src/interfaces/token.types';
import { HttpException } from '../errors';
import { getMessage, SupportedLanguages } from '../locales';
import { encrypt } from './encrypt';

export type Statements = {
  name: string;
  label: string;
  discount?: {
    encryptedValueBeforeDiscount?: string | number;
    encryptedValueAfterDiscount?: string | number;
  };
  encryptedValue: string | number; // Will keep it number during calculation and finally will encrypt it
  encryptedDiscountAmount?: string;
  relatedVoucherId?: number;
  relatedProviderServiceId?: number;
  relatedConstantId?: number;
  relatedServiceId?: number;
};

export type CalculateTotalAmoundParams = {
  userId: number;
  paymentMethodName: string;
  providerServiceBodyTypesIds?: string;
  autoSelectServiceIds?: string;
  autoSelectProposedServicePrice?: string;
  voucherCode?: string;
};

export type CalculateTotalAmoundReturnValue = {
  totalAmount: string;
  providerNetRevenue: number;
  statements: Statements[];
};

export type Timeout = {
  seconds: number;
  dateAfterAddingSeconds: number;
};

export type OrderStat = {
  isServiceProvided: boolean;
  isOrderFinished: boolean;
  orderCurrentStatus: 'in-progress' | 'completed' | 'not-completed' | 'unknown';
};

export const calculateTotalAmount = async (prisma: PrismaClient, params: CalculateTotalAmoundParams, logger?: any) => {
  const { paymentMethodName, providerServiceBodyTypesIds, autoSelectServiceIds, autoSelectProposedServicePrice } =
    params;

  let totalAmount: number = 0;

  let statements: Statements[] = [];

  if (providerServiceBodyTypesIds) {
    // Calculate provider services
    const providerServices = await prisma.providerServicesAllowedBodyTypes.findMany({
      where: {
        id: {
          in: providerServiceBodyTypesIds.split(',').map(Number),
        },
      },
      select: {
        id: true,
        Price: true,
        providerService: {
          select: {
            services: {
              select: {
                ServiceName: true,
              },
            },
          },
        },
      },
    });

    statements = statements.concat(
      providerServices.map((service) => ({
        name: service.providerService?.services?.ServiceName || '',
        label: service.providerService?.services?.ServiceName || '',
        isDiscounted: false,
        encryptedValue: getAmount(service.Price, ConstantType.Amount, new Decimal(totalAmount)),
        relatedProviderServiceId: service.id,
      })),
    );
  } else if (autoSelectServiceIds && autoSelectProposedServicePrice) {
    const serviceName = await prisma.services.findFirst({
      where: {
        id: { in: autoSelectServiceIds.split(',').map(Number) },
      },
      select: {
        ServiceName: true,
      },
    });

    const proposedPrice = new Decimal(Number(autoSelectProposedServicePrice));

    statements.push({
      relatedServiceId: Number(autoSelectServiceIds),
      encryptedDiscountAmount: undefined,
      name: serviceName?.ServiceName || '',
      label: serviceName?.ServiceName || '',
      encryptedValue: getAmount(proposedPrice, ConstantType.Amount, new Decimal(totalAmount)),
    });
  } else {
    throw new Error('Parameters are not valid');
  }

  // Calculate provider revenue
  const providerRevenue = _.sumBy(statements, (s) => Number(s.encryptedValue as string));

  // Checking the vouncher
  if (params.voucherCode) {
    const vouncherStatement = await processVouncherCode(prisma, params.voucherCode, providerRevenue, params.userId);
    if (vouncherStatement) {
      statements.push(vouncherStatement);
    }
  }
  //

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

  totalAmount = _.sumBy(statements, (statement) => Number(statement.encryptedValue as string));

  statements = statements.concat({
    name: vat?.Name || '',
    encryptedDiscountAmount: undefined,
    label: `${vat?.Label}${vat?.Type === ConstantType.Percentage ? ` (${vat.Value}%)` : ''} `,
    encryptedValue: getAmount(vat?.Value, vat?.Type, new Decimal(totalAmount)),
    relatedConstantId: vat?.id,
  });

  const serviceCharges = constants.find((value) => value.Name === Constants.ServiceCharges);
  const onlineCharges = constants.find((value) => value.Name === Constants.OnlinePaymentCharges);

  statements = statements.concat(
    [serviceCharges, onlineCharges].filter(Boolean).map((value: any) => ({
      isDiscounted: false,
      name: value?.Name || '',
      label: `${value?.Label}${value?.Type === ConstantType.Percentage ? ` (${value.Value}%)` : ''} `,
      encryptedValue: getAmount(value?.Value || 0, value?.Type, new Decimal(totalAmount)),
      relatedConstantId: value.id,
    })),
  );

  totalAmount = _.sumBy(statements, (statement) => Number(statement.encryptedValue as string));

  logger(
    `Order Total Amount Calculation ${JSON.stringify(
      statements.map((s) => ({ ...s, amount: s.encryptedValue as string })),
    )}`,
  );

  // Encrypting the values
  statements = statements.map((s) => {
    console.log(s.encryptedValue);

    return {
      ...s,
      ...(s.discount
        ? {
            discount: {
              encryptedValueAfterDiscount: encrypt(String(s.discount.encryptedValueAfterDiscount)),
              encryptedValueBeforeDiscount: encrypt(String(s.discount.encryptedValueBeforeDiscount)),
            },
          }
        : {}),
      encryptedValue: encrypt(String(s.encryptedValue)),
    };
  });

  return {
    totalAmount,
    providerRevenue,
    statements,
  };
};

export function getTimeoutObject(seconds: number): Timeout {
  return {
    seconds,
    dateAfterAddingSeconds: addSeconds(new Date(), seconds).getTime(),
  };
}

// Is order completed regardless if it's done/cancelled/rejected
export function getOrderStat(orderHistory: { orderHistoryItems: { HistoryName: string } }[]): OrderStat {
  const isServiceProvided = orderHistory.some(
    (item) => item.orderHistoryItems.HistoryName === OrderHistory.ServiceFinished,
  );

  const isOrderFinished = isServiceProvided
    ? true
    : Boolean(
        orderHistory.some(
          (item) =>
            item.orderHistoryItems.HistoryName === OrderHistory.Cancelled ||
            item.orderHistoryItems.HistoryName === OrderHistory.CustomerCancelled ||
            item.orderHistoryItems.HistoryName === OrderHistory.Timeout ||
            item.orderHistoryItems.HistoryName === OrderHistory.Rejected,
        ) && orderHistory.length > 0,
      );

  return {
    isOrderFinished,
    isServiceProvided,
    orderCurrentStatus:
      isOrderFinished && isServiceProvided
        ? 'completed'
        : isOrderFinished && !isServiceProvided
        ? 'not-completed'
        : !isOrderFinished && !isServiceProvided
        ? 'in-progress'
        : 'unknown',
  };
}

// Function to check if user have access to the order id
export async function userHasAccessToOrder(
  orderId: number,
  user: Token,
  prisma: PrismaClient,
  language: SupportedLanguages,
): Promise<boolean> {
  // Check if the user have sufficient permissions to access this order

  // If user is provider. Then two statements are possible. Either this order is assigned to him
  // Or this order is auto-select and still not assigned to any provider.

  if (user?.userType === UserTypes.Provider) {
    const foundOrder = await prisma.orders.findFirst({
      where: {
        AND: [{ id: orderId }],
      },
      select: {
        ProviderID: true,
        OrderSubmissionType: true,
        orderHistory: {
          select: {
            orderHistoryItems: {
              select: {
                HistoryName: true,
              },
            },
          },
        },
      },
    });

    if (!foundOrder) {
      throw new HttpException(HTTPResponses.Unauthorised, getMessage('error.noSufficientPermissions', language), {
        message: 'Order not found - Provider',
      });
    }

    if (foundOrder.OrderSubmissionType === OrderSubmissionType.AUTO_SELECT) {
      const isOrderComplete = getOrderStat(foundOrder.orderHistory);

      if (isOrderComplete.isOrderFinished) {
        if (foundOrder?.ProviderID !== user.providerId) {
          throw new HttpException(HTTPResponses.Unauthorised, getMessage('error.noSufficientPermissions', language), {
            message: 'Order is auto select but not assigned to this provider',
          });
        }
      }
    } else if (foundOrder.OrderSubmissionType === OrderSubmissionType.PROVIDER_SELECT) {
      if (foundOrder?.ProviderID !== user.providerId) {
        throw new HttpException(HTTPResponses.Unauthorised, getMessage('error.noSufficientPermissions', language), {
          message: 'Order is provider select but not assigned to this provider',
        });
      }
    }
  } else if (user?.userType === UserTypes.Customer) {
    const foundOrder = await prisma.orders.findFirst({
      where: {
        AND: [{ id: orderId }, { customer: { id: user.customerId } }],
      },
    });

    if (!foundOrder) {
      throw new HttpException(HTTPResponses.Unauthorised, getMessage('error.noSufficientPermissions', language), {
        message: 'Order not found - Customer',
      });
    }
  } else {
    throw new HttpException(HTTPResponses.Unauthorised, getMessage('error.noSufficientPermissions', language), {
      message: 'User type not supported for this operation',
    });
  }
  return true;
}

export async function processVouncherCode(
  prisma: PrismaClient,
  voucherCode: string,
  providerNetRevenue: number,
  userId: number,
): Promise<Statements | null> {
  const getVoucher = async (code: string) => {
    return await prisma.vouchers.findFirst({
      where: {
        AND: [
          {
            IsActive: { equals: true },
            Code: { equals: code },
          },
        ],
      },
      select: {
        Label: true,
        DiscountPercentage: true,
        id: true,
      },
    });
  };

  // Check if the voucher code is valid
  // Check if the voucher code is applicable to the services in the order
  // Calculate the discount amount
  // Add a new statement for the discount
  // Return the updated statements array
  let newStatement: Statements | null = null;

  switch (voucherCode) {
    case 'FIRSTORDER':
      const firstOrderVoucher = await getVoucher('FIRSTORDER');
      if (!firstOrderVoucher) break;

      // Check if it's the first order for customer
      const orders = await prisma.orders.findMany({
        where: {
          customer: {
            UserID: { equals: userId },
          },
        },
        select: {
          orderHistory: {
            select: {
              orderHistoryItems: {
                select: {
                  HistoryName: true,
                },
              },
            },
          },
        },
      });

      const orderCount = orders.filter((o) => getOrderStat(o.orderHistory).isServiceProvided).length;

      if (orderCount > 0) break;

      const amountToDeduct = providerNetRevenue * firstOrderVoucher.DiscountPercentage.toNumber();
      const discount = providerNetRevenue - amountToDeduct;
      newStatement = {
        label: firstOrderVoucher.Label,
        name: firstOrderVoucher.Label,
        discount: {
          encryptedValueBeforeDiscount: providerNetRevenue,
          encryptedValueAfterDiscount: discount,
        },
        relatedVoucherId: firstOrderVoucher.id,
        encryptedValue: -amountToDeduct,
      };
      break;

    default:
      break;
  }

  return newStatement;
}

import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import _ from 'lodash';
import envVars from '@src/config/environment';
import { HttpException } from '@src/errors/index';
import { Constants, HTTPResponses, OrderHistory, PaymentMethods } from '@src/interfaces/enums';
import { createAndGetIntent } from '@src/utils/payment';
import logger, { loggerUtils } from '@src/utils/logger';
import { calculateTotalAmount, getTimeoutObject, Timeout } from '@src/utils/orderUtils';
import { decrypt } from '@src/utils/encrypt';
import { Decimal } from '@prisma/client/runtime/library';
//#region AddOrder
type AddOrderQuery = {};

type AddOrderRequestBody = {
  providerId?: number;
  orderServices?: {
    carId: number;
    providerServiceBodyTypeId?: number;
    serviceId?: number;
  }[];
  paymentMethodName: string;
  orderAmount: number;
  longitude: number;
  latitude: number;
  addressString: string;
  additionalAddressData: any;
  additionalNotes?: string;
  autoSelectServiceIds?: string;
  autoSelectProposedServicePrice?: string;
  voucherCode?: string;
};

type AddOrderResponse = {
  id: number;
  clientSecret?: string | null;
  orderTimeoutSeconds: Timeout;
};

type AddOrderParams = { skipCardPayment?: string };

export const addOrderSchema: yup.SchemaOf<{ body: AddOrderRequestBody; query: AddOrderParams }> = yup.object({
  body: yup
    .object({
      providerId: yup.number().min(1).optional(),
      autoSelectProposedServicePrice: yup.string().optional(),
      autoSelectServiceIds: yup.string().optional(),
      orderServices: yup
        .array()
        .optional()
        .of(
          yup
            .object({
              carId: yup.number().min(1).required('Car id is required') as yup.NumberSchema<number>,
              providerServiceBodyTypeId: yup.number().min(1).optional() as yup.NumberSchema<number>,
              serviceId: yup.number().min(1).optional(),
            })
            .required()
            .test({
              message: 'Either providerServiceBodyTypeId or serviceId is required',
              test: (value) => {
                if (!value.providerServiceBodyTypeId && !value.serviceId) return false;
                if (value.providerServiceBodyTypeId && value.serviceId) return false;
                return Boolean(value?.providerServiceBodyTypeId || value?.serviceId);
              },
            }),
        )
        .test({
          message: 'There must be at least one order service',
          test: (arr: any) => !arr || arr.length > 0,
        }),
      paymentMethodName: yup.string().required(),
      orderAmount: yup.number().min(1).required('order amount is required'),
      longitude: yup.number().required('longitude is required'),
      latitude: yup.number().required('latitude is required'),
      addressString: yup.string().required('address is required'),
      additionalAddressData: yup.object().optional(),
      additionalNotes: yup.string().optional(),
      voucherCode: yup.string().optional(),
    })
    .test({
      message: 'There either should be orderServices or auto select service ids',
      test: (value) => {
        if (
          (Array.isArray(value?.orderServices) && value.orderServices.length > 0) ||
          value?.autoSelectServiceIds ||
          value?.autoSelectProposedServicePrice
        ) {
          return true;
        }
        return false;
      },
    })
    .test({
      message: 'If provider id is provided, then no auto select service ids should be provided',
      test: (value) => {
        if (value?.providerId && value?.autoSelectServiceIds) {
          return false;
        }
        return true;
      },
    }),
  query: yup
    .object()
    .shape({
      skipCardPayment: yup.string().optional().oneOf(['true', 'false']),
    })
    .optional(),
});

const addOrder: RequestHandler<AddOrderQuery, AddOrderResponse, AddOrderRequestBody, AddOrderParams> = async (
  req,
  res,
  next,
) => {
  let {
    addressString,
    latitude,
    longitude,
    orderAmount,
    orderServices,
    providerId,
    paymentMethodName,
    additionalAddressData,
    autoSelectProposedServicePrice,
    autoSelectServiceIds,
    additionalNotes,
    voucherCode,
  } = req.body;

  // Ensure we always work with an array to avoid undefined errors in tests and when using auto-select
  const servicesArray = Array.isArray(orderServices) ? orderServices : [];

  let createdOrderId: number | undefined;
  try {
    req.logger.info('Order creation initiated', {
      providerId,
      orderAmount,
      servicesCount: servicesArray.length,
      paymentMethod: paymentMethodName,
      customerId: req.user?.customerId,
    });

    const calculatedTotalStatement = await calculateTotalAmount(
      req.prisma,
      {
        paymentMethodName,
        providerServiceBodyTypesIds: servicesArray.map((service) => service.providerServiceBodyTypeId).join(','),
        autoSelectProposedServicePrice: autoSelectProposedServicePrice,
        autoSelectServiceIds: autoSelectServiceIds,
        userId: req.user.id,
        voucherCode,
      },
      logger.info,
    );

    if (calculatedTotalStatement.totalAmount !== orderAmount)
      throw new HttpException(HTTPResponses.BusinessError, '', "Order total amount doesn't match");

    // Check if order method is active
    const orderMethod = await req.prisma.paymentMethods.findUnique({
      where: { MethodName: paymentMethodName },
      select: { isActive: true },
    });

    if (!orderMethod) throw new HttpException(HTTPResponses.BusinessError, '', 'Order method is incorrect');

    if (!orderMethod.isActive)
      throw new HttpException(HTTPResponses.BusinessError, '', 'Order method is not active : ' + paymentMethodName);

    if (servicesArray.length > 0 && !autoSelectServiceIds && !autoSelectProposedServicePrice) {
      // Check if the provided car have same body type for the services
      for (let service of servicesArray) {
        const [car, providerService] = await Promise.all([
          req.prisma.cars.findUnique({ where: { id: service.carId }, select: { BodyTypeID: true } }),
          req.prisma.providerServicesAllowedBodyTypes.findUnique({
            where: { id: service.providerServiceBodyTypeId },
            select: { BodyTypeID: true },
          }),
        ]);

        if (car?.BodyTypeID !== providerService?.BodyTypeID)
          throw new HttpException(HTTPResponses.BusinessError, '', 'Not all cars match the body tpes');
      }
    }

    const isAutoSelectProvider = autoSelectProposedServicePrice && autoSelectServiceIds; // Means the order is auto-selecting provider

    const createOrderResult = await req.prisma.orders.create({
      data: {
        orderAmountStatements: {
          create: calculatedTotalStatement.statements.map((amount) => ({
            Amount: new Decimal(decrypt((amount.encryptedValue as string) || '')),
            RelatedConstantID: amount.relatedConstantId,
            RelatedProviderServiceID: amount.relatedProviderServiceId,
            RelatedServiceID: amount.relatedServiceId,
            RelatedVoucherID: amount.relatedVoucherId,
            DiscountAmount: amount.discount?.encryptedValueAfterDiscount
              ? new Decimal(Math.abs(Number(decrypt((amount?.encryptedValue as string) || ''))))
              : undefined,
            Name: amount.name,
          })),
        },
        ProviderNetProfit: new Decimal(calculatedTotalStatement.providerRevenue || ''),
        OrderTimeoutSeconds: Number(envVars.order.timeout),
        OrderSubmissionType: isAutoSelectProvider ? 'AUTO_SELECT' : 'PROVIDER_SELECT',
        AdditionalNotes: additionalNotes,
        Longitude: longitude,
        Latitude: latitude,
        AddressString: addressString,
        customer: { connect: { id: req.user.customerId } },
        ...(providerId && { provider: { connect: { id: providerId } } }), // Only connect provider if providerId is provided
        orderHistory: {
          create: {
            orderHistoryItems: {
              connect: {
                HistoryName:
                  paymentMethodName === PaymentMethods.Credit
                    ? OrderHistory.PendingPayment
                    : isAutoSelectProvider
                    ? OrderHistory.LookingForProvider
                    : OrderHistory.Pending,
              },
            },
          },
        },
        AdditionalAddressData: additionalAddressData || {},
        OrderTotalAmount: orderAmount,
        paymentMethods: {
          connect: {
            MethodName: paymentMethodName,
          },
        },
        orderServices: servicesArray.length
          ? {
              create: servicesArray.map((service) => ({
                CarID: service.carId,
                ProviderServiceBodyTypeID: service.providerServiceBodyTypeId,
                ServiceID: service.serviceId,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });

    createdOrderId = createOrderResult.id;

    let clientSecret: string | null = null;
    if (paymentMethodName === PaymentMethods.Credit && !req.query.skipCardPayment) {
      const companyFees = [Constants.OnlinePaymentCharges, Constants.VAT, Constants.ServiceCharges];

      const agreedFees = calculatedTotalStatement.statements.filter((statement) =>
        companyFees.includes(statement.name as Constants),
      );

      const totalCompanyFeesAed = _.sumBy(agreedFees, (fee) => Number(fee.encryptedValue as string));

      const providerServiceFees = calculatedTotalStatement.statements.filter(
        (statement) => statement.relatedProviderServiceId,
      );

      const totalOrderFees = _.sumBy(providerServiceFees, (fee) => Number(fee.encryptedValue as string));

      //   const intent = await createAndGetIntent(totalCompanyFeesAed + totalOrderFees);

      //   clientSecret = intent.clientSecret;

      //   await req.prisma.orders.update({
      //     where: { id: createOrderResult.id },
      //     data: {
      //       PaymentIntentID: intent.paymentIntentId,
      //     },
      //   });
      // }
    }

    req.logger.info('Order created successfully', {
      orderId: createOrderResult.id,
      customerId: req.user?.customerId,
      providerId,
      orderAmount,
      hasPaymentIntent: !!clientSecret,
    });

    //@ts-ignore
    createSuccessResponse(
      req,
      res,
      { id: createOrderResult.id, clientSecret, orderTimeoutSeconds: getTimeoutObject(Number(envVars.order.timeout)) },
      next,
    );
  } catch (error: any) {
    req.logger.error(error as Error, 'Add Order Controller', {
      providerId,
      orderAmount,
      customerId: req.user?.customerId,
    });
    createFailResponse(req, res, error, next);
    if (createdOrderId) {
      req.logger.warn('Cleaning up created order due to error', { orderId: createdOrderId });
      await req.prisma.orders.delete({ where: { id: createdOrderId } });
    }
  }
};
//#endregion

export default addOrder;

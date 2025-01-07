import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import _ from 'lodash';
import { Statements } from './getOrderTotalAmountStatements.controller';
import { decrypt } from '@src/utils/encrypt';
import { HttpException } from '@src/errors/index';
import { Constants, HTTPResponses, OrderHistory, PaymentMethods } from '@src/interfaces/enums';
import { Decimal } from '@prisma/client/runtime/library';
import { createAndGetIntent } from '@src/utils/payment';
//#region AddOrder
type AddOrderQuery = {};

type AddOrderRequestBody = {
  providerId: number;
  orderServices: {
    carId: number;
    providerServiceBodyTypeId: number;
  }[];
  orderTotalAmountStatement: Omit<Statements, 'label'>[];
  paymentMethodName: string;
  orderAmount: number;
  longitude: number;
  latitude: number;
  addressString: string;
  additionalAddressData: any;
};

type AddOrderResponse = {
  id: number;
  clientSecret?: string | null;
};

type AddOrderParams = { skipCardPayment: string };

export const addOrderSchema: yup.SchemaOf<{ body: AddOrderRequestBody; query: AddOrderParams }> = yup.object({
  body: yup.object({
    providerId: yup.number().min(1).required('Provider id is required'),
    orderServices: yup
      .array()
      .of(
        yup.object({
          carId: yup.number().min(1).required('Car id is required'),
          providerServiceBodyTypeId: yup.number().min(1).required('Service id is required'),
        }),
      )
      .test({
        message: 'There must be at least one order service',
        test: (arr: any) => arr.length > 0,
      }),
    paymentMethodName: yup.string().required(),
    orderTotalAmountStatement: yup
      .array()
      .of(
        yup.object({
          name: yup.string().required().required('name required'),
          encryptedValue: yup.string().required(''),
          relatedConstantId: yup.number().optional().positive(),
          relatedProviderServiceId: yup.number().optional().positive('Service id is required'),
        }),
      )
      .test({
        message: 'There must be at least one order service',
        test: (arr: any) => arr.length > 0,
      })
      .test({
        message: '',
        test: (arr: any) =>
          !arr?.some((statemnt: any) => !statemnt.relatedConstantId && !statemnt.relatedProviderServiceId),
      }),
    orderAmount: yup.number().min(1).required('order amount is required'),
    longitude: yup.number().required('longitude is required'),
    latitude: yup.number().required('latitude is required'),
    addressString: yup.string().required('address is required'),
    additionalAddressData: yup.object().optional(),
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
    orderTotalAmountStatement,
    providerId,
    paymentMethodName,
    additionalAddressData,
  } = req.body;

  let createdOrderId: number | undefined;
  try {
    orderTotalAmountStatement = orderTotalAmountStatement.map((statement) => ({
      ...statement,
      encryptedValue: new Decimal(decrypt(statement.encryptedValue as string)),
    }));

    const totalOrderAmount = _.sumBy(orderTotalAmountStatement, (statement) =>
      new Decimal(statement.encryptedValue).toNumber(),
    );

    if (totalOrderAmount !== orderAmount)
      throw new HttpException(HTTPResponses.BusinessError, '', "Order total amount doesn't match");

    // Check if order method is active
    const orderMethod = await req.prisma.paymentMethods.findUnique({ where: { MethodName: paymentMethodName }, select: { isActive: true } });

    if (!orderMethod)
      throw new HttpException(HTTPResponses.BusinessError, "", "Order method is incorrect");

    if (!orderMethod.isActive)
      throw new HttpException(HTTPResponses.BusinessError, "", "Order method is not active : " + paymentMethodName);

    // Check if the provided car have same body type for the services
    for (let service of orderServices) {
      const [car, providerService] = await Promise.all([
        req.prisma.cars.findUnique({ where: { id: service.carId }, select: { BodyTypeID: true } }),
        req.prisma.providerServicesAllowedBodyTypes.findUnique({ where: { id: service.providerServiceBodyTypeId }, select: { BodyTypeID: true } })
      ]);

      if (car?.BodyTypeID !== providerService?.BodyTypeID)
        throw new HttpException(HTTPResponses.BusinessError, "", "Not all cars match the body tpes")
    }


    const createOrderResult = await req.prisma.orders.create({
      data: {
        orderAmountStatements: {
          create: orderTotalAmountStatement.map((amount) => ({
            Amount: amount.encryptedValue,
            RelatedConstantID: amount.relatedConstantId,
            RelatedProviderServiceID: amount.relatedProviderServiceId,
            Name: amount.name,
          })),
        },
        Longitude: longitude,
        Latitude: latitude,
        AddressString: addressString,
        customer: { connect: { id: req.user.customerId } },
        provider: { connect: { id: providerId } },
        orderHistory: {
          create: {
            orderHistoryItems: {
              connect: {
                HistoryName:
                  paymentMethodName === PaymentMethods.Credit ? OrderHistory.PendingPayment : OrderHistory.Pending,
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
        orderServices: {
          create: orderServices?.map((service) => ({
            CarID: service.carId,
            ProviderServiceBodyTypeID: service.providerServiceBodyTypeId,
          })),
        },
      },
      select: { id: true },
    });

    createdOrderId = createOrderResult.id;

    let clientSecret: string | null;
    if (paymentMethodName === PaymentMethods.Credit && !req.query.skipCardPayment) {
      const companyFees = [Constants.OnlinePaymentCharges, Constants.VAT, Constants.ServiceCharges];

      const agreedFees = orderTotalAmountStatement.filter((statement) =>
        companyFees.includes(statement.name as Constants),
      );

      const totalCompanyFeesAed = _.sumBy(agreedFees, (fee) => Number(fee.encryptedValue as string));

      const providerServiceFees = orderTotalAmountStatement.filter((statement) => statement.relatedProviderServiceId);

      const totalOrderFees = _.sumBy(providerServiceFees, (fee) => Number(fee.encryptedValue as string));

      const intent = await createAndGetIntent(totalCompanyFeesAed + totalOrderFees);

      clientSecret = intent.clientSecret;

      await req.prisma.orders.update({
        where: { id: createOrderResult.id },
        data: {
          PaymentIntentID: intent.paymentIntentId,
        },
      });
    }
    //@ts-ignore
    createSuccessResponse(req, res, { id: createOrderResult.id, clientSecret }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
    if (createdOrderId) await req.prisma.orders.delete({ where: { id: createdOrderId } });
  }
};
//#endregion

export default addOrder;

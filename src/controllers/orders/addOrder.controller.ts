import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
//#region AddOrder
type AddOrderQuery = {};

type AddOrderRequestBody = {
  providerId: number;
  customerId: number;
  orderServices: {
    carId: number;
    providerServiceId: number;
  }[];
  orderAmount: number;
  longitude: number;
  latitude: number;
  addressString: string;
};

type AddOrderResponse = {
  id: number;
};

type AddOrderParams = {};

export const addOrderSchema: yup.SchemaOf<{ body: AddOrderRequestBody }> = yup.object({
  body: yup.object({
    providerId: yup.number().min(1).required('Provider id is required'),
    customerId: yup.number().min(1).required('customer id is required'),
    orderServices: yup
      .array()
      .of(
        yup.object({
          carId: yup.number().min(1).required('Car id is required'),
          providerServiceId: yup.number().min(1).required('Service id is required'),
        }),
      )
      .test({
        message: 'There must be at least one order service',
        test: (arr: any) => arr.length > 0,
      }),
    orderAmount: yup.number().min(1).required('order amount is required'),
    longitude: yup.number().required('longitude is required'),
    latitude: yup.number().required('latitude is required'),
    addressString: yup.string().required('address is required'),
  }),
});

const addOrder: RequestHandler<AddOrderQuery, AddOrderResponse, AddOrderRequestBody, AddOrderParams> = async (
  req,
  res,
  next,
) => {
  try {
    const createOrderResult = await prisma.orders.create({
      data: {
        Longitude: req.body.longitude,
        Latitude: req.body.latitude,
        AddressString: req.body.addressString,
        customer: { connect: { id: req.body.customerId } },
        provider: { connect: { id: req.body.providerId } },
        orderHistory: {
          create: {
            orderHistoryItems: { connect: { HistoryName: 'Pending' } },
          },
        },
        OrderTotalAmount: req.body.orderAmount,
        paymentMethods: {
          connect: {
            MethodName: 'Cash',
          },
        },
        orderServices: {
          create: req.body.orderServices?.map((service) => ({
            CarID: service.carId,
            ProviderServiceID: service.providerServiceId,
          })),
        },
      },
      select: { id: true },
    });
    createSuccessResponse(req, res, { id: createOrderResult.id }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default addOrder;

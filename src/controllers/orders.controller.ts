import { RequestHandler } from "express";
import prismaClient from "../../prisma/client";

const prisma = prismaClient;
//#region AddOrder
type AddOrderLinkQuery = {};

type AddOrderRequestBody = {
  providerId: number;
  customerId: number;
  orderServices: {
    carId: number;
    serviceId: number;
  }[];
  orderAmount: number;
  longitude: number;
  latitude: number;
  addressString: string;
};

type AddOrderResponse = {
  id: number;
};

type AddOrderQueryParams = {};

export const addOrder: RequestHandler<
  AddOrderLinkQuery,
  AddOrderResponse,
  AddOrderRequestBody,
  AddOrderQueryParams,
  any
> = async (req, res, next) => {
  try {
    const order = await prisma.orders.create({
      data: {
        Longitude: req.body.longitude,
        Latitude: req.body.latitude,
        AddressString: req.body.addressString,
        customer: { connect: { id: req.body.customerId } },
        provider: { connect: { id: req.body.providerId } },
        orderHistory: {
          create: {
            orderHistoryItems: { connect: { HistoryName: "Pending" } },
          },
        },
        OrderTotalAmount: req.body.orderAmount,
        paymentMethods: {
          connect: {
            MethodName: "Cash",
          },
        },
        orderServices: {
          create: req.body.orderServices?.map((service) => ({
            CarID: service.carId,
            ServiceID: service.serviceId,
          })),
        },
      },
      select: { id: true },
    });
    res.status(200).json({ id: order.id });
  } catch (error: any) {
    next(error);
  }
};
//#endregion
//#region GetOneOrder
type GetOneOrderLinkQuery = {};

type GetOneOrderRequestBody = {};

type GetOneOrderResponse = {
  OrderTotalAmount: number;
  OrderCreatedDate: Date;
  Longitude: number;
  Latitude: number;
  AddressString: string;
  customer: {
    id: number;
    users: {
      FirstName: string;
      LastName: string;
    };
  };
  orderServices: {
    cars: {
      PlateNumber: string;
      Manufacturer: string;
      Model: string;
      bodyTypes: {
        TypeName: string;
      };
    };
  }[];
  id: number;
};

type GetOneOrderQueryParams = {
  id: string;
};

export const getOneOrder: RequestHandler<
  GetOneOrderLinkQuery,
  GetOneOrderResponse,
  GetOneOrderRequestBody,
  GetOneOrderQueryParams,
  any
> = async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(req.query.id) },
      select: {
        Longitude: true,
        Latitude: true,
        AddressString: true,
        id: true,
        orderServices: {
          select: {
            cars: {
              select: {
                PlateNumber: true,
                bodyTypes: { select: { TypeName: true } },
                Manufacturer: true,
                Model: true,
              },
            },
          },
        },
        OrderTotalAmount: true,
        OrderCreatedDate: true,
        customer: {
          select: {
            id: true,
            users: { select: { FirstName: true, LastName: true } },
          },
        },
      },
    });
    if (order) res.status(200).json(order);
  } catch (error: any) {
    next(error);
  }
};
//#endregion

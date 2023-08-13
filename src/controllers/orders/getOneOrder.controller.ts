import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';

//#region GetOneOrder
type GetOneOrderParams = { id: string };

type GetOneOrderRequestBody = {};

type GetOneOrderResponse = {
  id: number;
  Longitude: number;
  Latitude: number;
  AddressString: string;
  OrderTotalAmount: Prisma.Decimal;
  OrderCreatedDate: Date;
  customer: {
    id: Prisma.Decimal;
    users: {
      FirstName: string;
      LastName: string;
    };
  };
  orderServices: {
    providerServices: {
      Price: Prisma.Decimal;
      services: {
        ServiceName: string;
        ServicePrice: Prisma.Decimal;
        ServiceDescription: string;
      } | null;
    } | null;
    cars: {
      PlateNumber: string;
      Manufacturer: string;
      Model: string;
      bodyTypes: {
        TypeName: string;
      };
      PlateCity: string;
    };
  }[];
} | null;

type GetOneOrderQuery = {};

export const getOneOrderSchema: yup.SchemaOf<{ params: GetOneOrderParams }> = yup.object({
  params: yup.object({
    id: yup.string().min(1).required(),
  }),
});

const getOneOrder: RequestHandler<
  GetOneOrderParams,
  GetOneOrderResponse,
  GetOneOrderRequestBody,
  GetOneOrderQuery,
  any
> = async (req, res, next) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        Longitude: true,
        Latitude: true,
        AddressString: true,
        id: true,
        orderServices: {
          select: {
            providerServices: {
              select: {
                services: {
                  select: {
                    ServiceDescription: true,
                    ServiceName: true,
                  },
                },
                Price: true,
              },
            },
            cars: {
              select: {
                PlateNumber: true,
                bodyTypes: { select: { TypeName: true } },
                Manufacturer: true,
                PlateCity: true,
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
    // if (!order) throw new HttpException(422, `No order found with id ${req.params.id}`);
    //@ts-ignore
    createSuccessResponse(req, res, order || {}, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getOneOrder;

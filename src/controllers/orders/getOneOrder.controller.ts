import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region GetOneOrder
type GetOneOrderParams = { id: string };

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
    // if (!order) throw new HttpException(422, `No order found with id ${req.params.id}`);
    createSuccessResponse(req, res, order || {}, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default getOneOrder;

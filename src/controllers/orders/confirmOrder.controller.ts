import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import { ResultResponse } from '@src/interfaces/express.types';

//#region ConfirmOrder
type ConfirmOrderParams = { orderId: string };

type ConfirmOrderRequestBody = {
  rating: number;
  feedback?: string;
};

type ConfirmOrderResponse = ResultResponse;

type ConfirmOrderQuery = {};

export const confirmOrderSchema: yup.SchemaOf<{ params: ConfirmOrderParams; body: ConfirmOrderRequestBody }> =
  yup.object({
    params: yup.object({
      orderId: yup.string().min(1).required(),
    }),
    body: yup.object({
      feedback: yup.string().optional(),
      rating: yup.number().required().min(0),
    }),
  });

const confirmOrder: RequestHandler<
  ConfirmOrderParams,
  ConfirmOrderResponse,
  ConfirmOrderRequestBody,
  ConfirmOrderQuery,
  any
> = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { rating, feedback } = req.body;

    const createdRating = await req.prisma.orderRating.create({
      data: {
        Rating: rating,
        Feedback: feedback,
        OrderID: Number(orderId),
      },
      select: {
        id: true,
      },
    });
    createSuccessResponse(req, res, { result: true, createdItemId: createdRating.id }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default confirmOrder;

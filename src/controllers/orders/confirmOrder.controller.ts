import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';
import { ResultResponse } from '@src/interfaces/express.types';
import HttpException from '@src/errors/HttpException';
import { HTTPErrorMessages, HTTPResponses } from '@src/interfaces/enums';

//#region ConfirmOrder
type ConfirmOrderParams = { orderId: string };

type ConfirmOrderRequestBody = {
  rating: number;
  isOrderCompleted?: boolean;
  notes?: string; // Changed from feedback to notes for clarity
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
      isOrderCompleted: yup.bool().optional(),
      notes: yup.string().optional(), // Changed from feedback to notes for clarity
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
    const { rating, feedback, isOrderCompleted, notes } = req.body;

    // User should only be able to confirm their own orders
    const order = await req.prisma.orders.findFirst({
      where: {
        AND: [{ id: Number(orderId) }, { customer: { UserID: { equals: req.user?.id } } }],
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorMessages.NoSufficientPermissions, {
        message: 'You do not have permission to confirm this order.',
      });
    }

    const createdRating = await req.prisma.orderRating.create({
      data: {
        Rating: rating,
        isOrderCompleted,
        Notes: notes || (!isOrderCompleted ? 'Cancelled by user' : ''),
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

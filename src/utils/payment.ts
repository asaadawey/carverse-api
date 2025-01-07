import envVars from '@src/config/environment';
import prisma from '@src/helpers/databaseHelpers/client';
import { OrderHistory } from '@src/interfaces/enums';
import Stripe from 'stripe';

type CreateAndGetIntentReturn = {
  clientSecret: string | null;
  paymentIntentId: string | null;
};

export const createAndGetIntent = async (totalAmount: number): Promise<CreateAndGetIntentReturn> => {
  const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });

  const client = await stripe.paymentIntents.create({
    amount: totalAmount * 100,
    payment_method_types: ['card'],
    currency: 'AED',

    description: 'Carverse services',
    capture_method: 'manual',

  });

  return {
    clientSecret: client.client_secret,
    paymentIntentId: client.id,
  };
};

export const cancelOnHoldPayment = async (orderId: number) => {
  const order = await prisma.orders.findUnique({
    where: {
      id: orderId,
    },
    select: {
      PaymentIntentID: true,
    },
  });
  if (order?.PaymentIntentID) {
    const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });
    await stripe.paymentIntents.cancel(order?.PaymentIntentID);

    await prisma.orderHistory.create({
      data: {
        orders: {
          connect: {
            id: orderId,
          },
        },
        orderHistoryItems: {
          connect: {
            HistoryName: OrderHistory.PaymentCaptureCancelled,
          },
        },
      },
    });
  }
};

export const capturePayment = async (orderId: number) => {
  const order = await prisma.orders.findUnique({
    where: {
      id: orderId,
    },
    select: {
      PaymentIntentID: true,
      OrderTotalAmount: true,
    },
  });
  if (order?.PaymentIntentID) {
    const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });

    await stripe.paymentIntents.capture(order?.PaymentIntentID, { amount_to_capture: order.OrderTotalAmount * 100 });

    await prisma.orderHistory.create({
      data: {
        orders: {
          connect: {
            id: orderId,
          },
        },
        orderHistoryItems: {
          connect: {
            HistoryName: OrderHistory.PaymentCaptured,
          },
        },
      },
    });
  }
};

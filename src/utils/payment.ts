import envVars from '@src/config/environment';
import prisma from '@src/helpers/databaseHelpers/client';
import { OrderHistory, PaymentMethods } from '@src/interfaces/enums';
import { ActiveOrders } from '../web-socket';
import axios from 'axios';

type CreateAndGetIntentReturn = {
  clientSecret: string | null;
  paymentIntentId: string | null;
};

export const getToken = async (logger?: any) => {
  // try {
  //   const response = await axios.post(`${envVars.paymob.baseUrl}/auth/tokens`, {
  //     api_key: envVars.paymob.apiKey,
  //   });
  //   return response.data.token;
  // } catch (error: any) {
  //   logger?.error(`Failed to get Paymob token: ${error.message}`);
  // }
};

export const createAndGetIntent = async (totalAmount: number, logger?: any) /*: Promise<CreateAndGetIntentReturn>*/ => {
  // const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });
  // const client = await stripe.paymentIntents.create({
  //   amount: totalAmount * 100,
  //   payment_method_types: ['card'],
  //   currency: 'AED',
  //   description: 'Carverse services',
  //   capture_method: 'manual',
  // });
  // return {
  //   clientSecret: client.client_secret,
  //   paymentIntentId: client.id,
  // };
};

export const cancelOnHoldPayment = async (socketOrder: { orderId: number; orderPaymentMethod?: PaymentMethods }) => {
  // if (socketOrder.orderPaymentMethod && socketOrder.orderPaymentMethod !== PaymentMethods.Credit) return;
  // const order = await prisma.orders.findUnique({
  //   where: {
  //     id: socketOrder.orderId,
  //   },
  //   select: {
  //     PaymentIntentID: true,
  //   },
  // });
  // if (order?.PaymentIntentID) {
  //   const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });
  //   const result = await stripe.paymentIntents.cancel(order?.PaymentIntentID);
  //   await prisma.orderHistory.create({
  //     data: {
  //       orders: {
  //         connect: {
  //           id: socketOrder.orderId,
  //         },
  //       },
  //       Notes: JSON.stringify({ result }),
  //       orderHistoryItems: {
  //         connect: {
  //           HistoryName: OrderHistory.PaymentCaptureCancelled,
  //         },
  //       },
  //     },
  //   });
  // }
};

export const capturePayment = async (socketOrder: ActiveOrders) => {
  // if (socketOrder.orderPaymentMethod && socketOrder.orderPaymentMethod !== PaymentMethods.Credit) return;
  // const order = await prisma.orders.findUnique({
  //   where: {
  //     id: socketOrder.orderId,
  //   },
  //   select: {
  //     PaymentIntentID: true,
  //     OrderTotalAmount: true,
  //   },
  // });
  // if (order?.PaymentIntentID) {
  //   const stripe = new Stripe(envVars.stripe.secret, { apiVersion: '2022-11-15' });
  //   const result = await stripe.paymentIntents.capture(order?.PaymentIntentID, {
  //     amount_to_capture: order.OrderTotalAmount * 100,
  //   });
  //   await prisma.orderHistory.create({
  //     data: {
  //       orders: {
  //         connect: {
  //           id: socketOrder.orderId,
  //         },
  //       },
  //       Notes: JSON.stringify({ result }),
  //       orderHistoryItems: {
  //         connect: {
  //           HistoryName: OrderHistory.PaymentCaptured,
  //         },
  //       },
  //     },
  //   });
  // }
};

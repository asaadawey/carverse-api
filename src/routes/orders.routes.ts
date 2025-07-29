import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';

import {
  addOrder,
  getOneOrder,
  getOrderTotalAmountStatements,
  confirmOrder,
  getAllOrders,
} from '@src/controllers/orders/index';

import { validate } from '@src/utils/schema';

import { addOrderSchema } from '@src/controllers/orders/addOrder.controller';
import { getOneOrderSchema } from '@src/controllers/orders/getOneOrder.controller';
import { getOrderTotalAmountStatementsSchema } from '@src/controllers/orders/getOrderTotalAmountStatements.controller';
import { confirmOrderSchema } from '@src/controllers/orders/confirmOrder.controller';
import { getAllOrdersSchema } from '@src/controllers/orders/getAllOrders.controller';

const router = Router();

/**
 * @swagger
 * /orders/add:
 *   post:
 *     summary: Create a new order
 *     description: Add a new car wash order to the system
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skipCardPayment
 *         schema:
 *           type: string
 *         description: Skip card payment process
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - orderServices
 *               - orderTotalAmountStatement
 *               - paymentMethodName
 *               - orderAmount
 *               - longitude
 *               - latitude
 *               - addressString
 *               - additionalAddressData
 *             properties:
 *               providerId:
 *                 type: integer
 *                 example: 1
 *               orderServices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     carId:
 *                       type: integer
 *                       example: 1
 *                     providerServiceBodyTypeId:
 *                       type: integer
 *                       example: 1
 *               orderTotalAmountStatement:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                       example: 25.99
 *               paymentMethodName:
 *                 type: string
 *                 example: "Credit Card"
 *               orderAmount:
 *                 type: number
 *                 example: 25.99
 *               longitude:
 *                 type: number
 *                 example: -122.4194
 *               latitude:
 *                 type: number
 *                 example: 37.7749
 *               addressString:
 *                 type: string
 *                 example: "123 Main St, City, State"
 *               additionalAddressData:
 *                 type: object
 *                 example: {}
 *               additionalNotes:
 *                 type: string
 *                 example: "Please call when arrived"
 *     responses:
 *       200:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         clientSecret:
 *                           type: string
 *                           nullable: true
 *                           example: "pi_1234567890_secret_abcdef"
 */
router.post(RouterLinks.addOrder, validate(addOrderSchema), addOrder);

/**
 * @swagger
 * /orders/one/{id}:
 *   get:
 *     summary: Get order details
 *     description: Retrieve detailed information about a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Order'
 */
router.get(RouterLinks.getOneOrder, validate(getOneOrderSchema), getOneOrder);

/**
 * @swagger
 * /orders/getOrderStatements:
 *   get:
 *     summary: Get order total amount statements
 *     description: Calculate and retrieve order total amount breakdown
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                             example: "Service Fee"
 *                           amount:
 *                             type: number
 *                             example: 25.99
 */
router.get(
  RouterLinks.getOrderTotalAmountStatements,
  validate(getOrderTotalAmountStatementsSchema),
  getOrderTotalAmountStatements,
);

/**
 * @swagger
 * /orders/confirmOrder/{orderId}:
 *   post:
 *     summary: Confirm an order
 *     description: Confirm a pending order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to confirm
 *     responses:
 *       200:
 *         description: Order confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         confirmed:
 *                           type: boolean
 *                           example: true
 */
router.post(RouterLinks.confirmOrder, validate(confirmOrderSchema), confirmOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieve all orders with optional filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *         example: 1
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider ID
 *         example: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *         example: completed
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         orders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 1
 *                               customer:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   name:
 *                                     type: string
 *                                     example: John Doe
 *                               provider:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 1
 *                                   name:
 *                                     type: string
 *                                     example: Car Wash Pro
 *                               orderAmount:
 *                                 type: number
 *                                 example: 25.99
 *                               status:
 *                                 type: string
 *                                 example: completed
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: 2023-01-01T00:00:00.000Z
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                               example: 1
 *                             totalPages:
 *                               type: integer
 *                               example: 10
 *                             totalItems:
 *                               type: integer
 *                               example: 100
 *                             limit:
 *                               type: integer
 *                               example: 10
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(RouterLinks.getAllOrders, validate(getAllOrdersSchema), getAllOrders);

export default router;

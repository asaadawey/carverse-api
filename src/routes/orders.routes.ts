import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';

import {
  addOrder,
  getOneOrder,
  getOrderTotalAmountStatements,
  confirmOrder,
  getAllOrders,
  getProviderRevenue,
} from '@src/controllers/orders/index';

import { validate } from '@src/utils/schema';
import { cacheMiddleware, cacheTTL } from '@src/middleware/cache.middleware';

import { addOrderSchema } from '@src/controllers/orders/addOrder.controller';
import { getOneOrderSchema } from '@src/controllers/orders/getOneOrder.controller';
import { getOrderTotalAmountStatementsSchema } from '@src/controllers/orders/getOrderTotalAmountStatements.controller';
import { confirmOrderSchema } from '@src/controllers/orders/confirmOrder.controller';
import { getAllOrdersSchema, getAllOrdersMiddleware } from '@src/controllers/orders/getAllOrders.controller';
import {
  getProviderRevenueSchema,
  getProviderRevenueMiddleware,
} from '@src/controllers/orders/getProviderRevenue.controller';
import allowedUserTypeMiddleware from '@src/middleware/allowedUserType.middleware';
import { UserTypes } from '@src/interfaces/enums';

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
router.post(RouterLinks.addOrder, allowedUserTypeMiddleware([UserTypes.Customer]), validate(addOrderSchema), addOrder);

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
// Cache for single order - 5 minutes
router.get(
  RouterLinks.getOneOrder,
  cacheMiddleware((req) => `order:${req.params.id}:${req.user.id}`, cacheTTL.medium),
  validate(getOneOrderSchema),
  getOneOrder,
);

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
  allowedUserTypeMiddleware([UserTypes.Customer]),
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
router.post(
  RouterLinks.confirmOrder,
  validate(confirmOrderSchema),
  allowedUserTypeMiddleware([UserTypes.Customer]),
  confirmOrder,
);

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
// Cache for user orders - 2 minutes (shorter since it changes more frequently)
router.get(
  RouterLinks.getAllOrders,
  cacheMiddleware((req) => `user_orders:${req.user?.id}:${JSON.stringify(req.query)}`, cacheTTL.short * 2), // 2 minutes
  validate(getAllOrdersSchema),
  getAllOrders,
);

/**
 * @swagger
 * /orders/provider/revenue:
 *   get:
 *     summary: Get provider revenue statistics
 *     description: Calculate total orders count and revenue for the logged-in provider with car and service details
 *     tags: [Orders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering orders (ISO format)
 *         example: "2023-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering orders (ISO format)
 *     responses:
 *       200:
 *         description: Provider revenue data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: number
 *                       description: Total number of completed orders for the provider
 *                       example: 25
 *                     totalRevenue:
 *                       type: number
 *                       description: Total revenue from completed service orders
 *                       example: 2500.50
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                             example: 123
 *                           orderTotalAmount:
 *                             type: number
 *                             example: 150.0
 *                           orderCreatedDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-01-15T10:30:00Z"
 *                           customerName:
 *                             type: string
 *                             example: "John Doe"
 *                           revenue:
 *                             type: number
 *                             description: Provider's revenue from this order
 *                             example: 120.0
 *                           orderServices:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 serviceName:
 *                                   type: string
 *                                   example: "Premium Car Wash"
 *                                 serviceDescription:
 *                                   type: string
 *                                   example: "Full car cleaning service"
 *                                 price:
 *                                   type: number
 *                                   example: 80.0
 *                                 plateNumber:
 *                                   type: string
 *                                   example: "ABC123"
 *                                 manufacturer:
 *                                   type: string
 *                                   example: "Toyota"
 *                                 model:
 *                                   type: string
 *                                   example: "Camry"
 *                                 plateCity:
 *                                   type: string
 *                                   nullable: true
 *                                   example: "Riyadh"
 *                                 bodyType:
 *                                   type: string
 *                                   example: "Sedan"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - Provider only endpoint
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
// Cache for provider revenue - 5 minutes (financial data changes less frequently)
router.get(
  RouterLinks.getProviderRevenue,
  cacheMiddleware((req) => `provider_revenue:${req.user?.id}:${JSON.stringify(req.query)}`, cacheTTL.medium), // 5 minutes
  validate(getProviderRevenueSchema),
  ...getProviderRevenueMiddleware,
  getProviderRevenue,
);

export default router;

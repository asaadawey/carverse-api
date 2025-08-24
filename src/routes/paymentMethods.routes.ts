import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { getAllPaymentMethodsSchema } from '@src/controllers/payment/getAllPaymentMethods.controller';
import { getAllPaymentMethods } from '@src/controllers/payment/index';
import { validate } from '@src/utils/schema';

const router = Router();

/**
 * @swagger
 * /payment/methods:
 *   get:
 *     summary: Get all payment methods
 *     description: Retrieve a list of available payment methods
 *     tags: [Payment]
 *     parameters:
 *       - in: query
 *         name: take
 *         schema:
 *           type: string
 *         description: Number of items to take
 *       - in: query
 *         name: skip
 *         schema:
 *           type: string
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
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
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           MethodName:
 *                             type: string
 *                             example: "Credit Card"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 */
router.get(RouterLinks.getAllPaymentMethods, validate(getAllPaymentMethodsSchema), getAllPaymentMethods);

export default router;

import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';

import { getAllConstants, modifyConstant } from '@src/controllers/constants/index';

import { getAllConstantsSchema } from '@src/controllers/constants/getAllConstants.controller';
import { modifyConstantSchema } from '@src/controllers/constants/modifyConstant.controller';

const router = Router();

/**
 * @swagger
 * /constants:
 *   get:
 *     summary: Get all constants
 *     description: Retrieve all system constants and configuration values
 *     tags: [Constants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Constants retrieved successfully
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
 *                           ConstantName:
 *                             type: string
 *                             example: "SERVICE_FEE"
 *                           ConstantValue:
 *                             type: string
 *                             example: "2.50"
 *                           Description:
 *                             type: string
 *                             example: "Service fee percentage"
 */
router.get(RouterLinks.getAllConstants, validate(getAllConstantsSchema), getAllConstants);

/**
 * @swagger
 * /constants/update:
 *   put:
 *     summary: Update a constant
 *     description: Modify the value of a system constant (Admin only)
 *     tags: [Constants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - value
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *               value:
 *                 type: string
 *                 example: "3.00"
 *     responses:
 *       200:
 *         description: Constant updated successfully
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
 *                         updated:
 *                           type: boolean
 *                           example: true
 */
router.put(RouterLinks.modifyConstant, validate(modifyConstantSchema), modifyConstant);

export default router;

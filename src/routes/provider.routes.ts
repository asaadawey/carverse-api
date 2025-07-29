import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';

import { getAllProviders, getOneProvider, addProviderService } from '@src/controllers/providers/index';

import { getAllProvidersSchema } from '@src/controllers/providers/getAllProviders.controller';
import { getOneProviderSchema } from '@src/controllers/providers/getOneProvider.controller';
import { upsertProviderServiceschema } from '@src/controllers/providers/upsertProviderService.controller';

const router = Router();

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all providers
 *     description: Retrieve a list of all car wash service providers
 *     tags: [Providers]
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
 *         description: Providers retrieved successfully
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
 *                         $ref: '#/components/schemas/Provider'
 */
router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);

/**
 * @swagger
 * /providers/one/{id}:
 *   get:
 *     summary: Get provider details
 *     description: Retrieve detailed information about a specific provider
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Provider'
 */
router.get(RouterLinks.getOneProvider, validate(getOneProviderSchema), getOneProvider);

/**
 * @swagger
 * /providers/services/add:
 *   post:
 *     summary: Add provider service
 *     description: Add or update a service for a provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerId
 *               - serviceId
 *             properties:
 *               providerId:
 *                 type: integer
 *                 example: 1
 *               serviceId:
 *                 type: integer
 *                 example: 1
 *               price:
 *                 type: number
 *                 example: 25.99
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Provider service added successfully
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
 */
router.post(RouterLinks.addProviderService, validate(upsertProviderServiceschema), addProviderService);

export default router;

import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { getAllServices, getAllProviderServices, addService } from '@src/controllers/services/index';
import { validate } from '@src/utils/schema';
import { getAllProviderServicesSchema } from '@src/controllers/services/getAllProviderServices.controller';
import { getAllServicesSchema } from '@src/controllers/services/getAllServices.controller';
import { addServiceSchema } from '@src/controllers/services/addService.controller';

const router = Router();

/**
 * @swagger
 * /services/{moduleId}/{providerId}:
 *   get:
 *     summary: Get all services for a specific provider and module
 *     description: Retrieve all services offered by a provider for a specific module
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
 *       - in: path
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
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
 *         description: Provider services retrieved successfully
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
 *                         $ref: '#/components/schemas/Service'
 */
router.get(RouterLinks.getAllProviderServices, validate(getAllProviderServicesSchema), getAllProviderServices);

/**
 * @swagger
 * /services/{moduleId}:
 *   get:
 *     summary: Get all services for a module
 *     description: Retrieve all services available for a specific module
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Module ID
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
 *         description: Services retrieved successfully
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
 *                         $ref: '#/components/schemas/Service'
 */
router.get(RouterLinks.getAllServices, validate(getAllServicesSchema), getAllServices);

/**
 * @swagger
 * /services/add:
 *   post:
 *     summary: Add a new service
 *     description: Create a new service in the system
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ServiceName
 *               - ServiceDescription
 *               - ModuleID
 *             properties:
 *               ServiceName:
 *                 type: string
 *                 example: "Premium Wash"
 *               ServiceDescription:
 *                 type: string
 *                 example: "Premium car washing service with wax"
 *               ModuleID:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Service added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Service'
 */
router.post(RouterLinks.addServices, validate(addServiceSchema), addService);

export default router;

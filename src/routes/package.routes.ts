import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';
import { getAllPackages } from '@src/controllers/packages/index';
import { getAllPackagesSchema } from '@src/controllers/packages/getAllPackages.controller';

const router = Router();

/**
 * @swagger
 * /packages/{moduleId}:
 *   get:
 *     summary: Get all packages for a module
 *     description: Retrieve all service packages available for a specific module
 *     tags: [Packages]
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
 *         description: Packages retrieved successfully
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
 *                           PackageName:
 *                             type: string
 *                             example: "Basic Package"
 *                           PackageDescription:
 *                             type: string
 *                             example: "Basic car wash package"
 *                           Price:
 *                             type: number
 *                             example: 29.99
 */
router.get(RouterLinks.getPackages, validate(getAllPackagesSchema), getAllPackages);

export default router;

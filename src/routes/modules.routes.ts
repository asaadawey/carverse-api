import { Router } from 'express';
import { getAllModulesSchema } from '@src/controllers/modules/getAllModules.controller';
import { getAllModules } from '@src/controllers/modules/index';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';

const router = Router();

/**
 * @swagger
 * /modules:
 *   get:
 *     summary: Get all modules
 *     description: Retrieve a list of all available service modules
 *     tags: [Modules]
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
 *         description: Modules retrieved successfully
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
 *                           ModuleName:
 *                             type: string
 *                             example: "Car Wash"
 *                           ModuleDescription:
 *                             type: string
 *                             example: "Basic car washing services"
 */
router.get(RouterLinks.getModules, validate(getAllModulesSchema), getAllModules);

export default router;

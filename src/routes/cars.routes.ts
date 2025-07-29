import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { addCar, checkCarExist, getAllBodyTypes, getAllCars } from '@src/controllers/cars/index';

import { validate } from '@src/utils/schema';

import { getAllCarsSchema } from '@src/controllers/cars/getAllCars.controller';
import { getAllBodyTypesSchema } from '@src/controllers/cars/getAllBodyTypes.controller';
import { addCarSchema } from '@src/controllers/cars/addCar.controller';
import { verifyCarNumberSchema } from '@src/controllers/cars/checkCarExist.controller';

const router = Router();

/**
 * @swagger
 * /cars:
 *   get:
 *     summary: Get all cars
 *     description: Retrieve a list of cars for the authenticated user
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
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
 *         description: Cars retrieved successfully
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
 *                         $ref: '#/components/schemas/Car'
 */
router.get(RouterLinks.getCars, validate(getAllCarsSchema), getAllCars);

/**
 * @swagger
 * /cars/bodyTypes:
 *   get:
 *     summary: Get all car body types
 *     description: Retrieve a list of available car body types
 *     tags: [Cars]
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
 *         description: Body types retrieved successfully
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
 *                           TypeName:
 *                             type: string
 *                             example: "Sedan"
 */
router.get(RouterLinks.getBodyTypes, validate(getAllBodyTypesSchema), getAllBodyTypes);

/**
 * @swagger
 * /cars/add:
 *   post:
 *     summary: Add a new car
 *     description: Add a new car to the user's garage
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - PlateNumber
 *               - Model
 *               - Color
 *               - bodyTypeId
 *             properties:
 *               PlateNumber:
 *                 type: string
 *                 example: "ABC123"
 *               Model:
 *                 type: string
 *                 example: "Toyota Camry"
 *               Color:
 *                 type: string
 *                 example: "Blue"
 *               bodyTypeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Car added successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Car'
 */
router.post(RouterLinks.addCar, validate(addCarSchema), addCar);

/**
 * @swagger
 * /car/checkCarExist/{plateNumber}:
 *   get:
 *     summary: Verify car number
 *     description: Check if a car with the given plate number exists
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: plateNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Car plate number to verify
 *     responses:
 *       200:
 *         description: Car verification result
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
 *                         exists:
 *                           type: boolean
 *                           example: true
 */
router.get(RouterLinks.verifyCarNumber, validate(verifyCarNumberSchema), checkCarExist);
export default router;

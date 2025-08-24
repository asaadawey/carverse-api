import { Router } from 'express';
import { getDropdownValuesSchema } from '@src/controllers/dropdown/getDropdownValues.controller';
import { getDropdownValues } from '@src/controllers/dropdown/index';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';
import { cacheMiddleware, cacheTTL } from '@src/middleware/cache.middleware';

const router = Router();

/**
 * @swagger
 * /values:
 *   get:
 *     summary: Get dropdown values
 *     description: Retrieve dropdown values for client-side selects
 *     tags: [Values]
 */
router.get(
  RouterLinks.getValues,
  validate(getDropdownValuesSchema),
  cacheMiddleware((req) => `values:${req.query.param1}:${req.query.param2}`, cacheTTL.long),
  getDropdownValues,
);

export default router;

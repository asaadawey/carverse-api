import { Router } from 'express';
import { getAllModulesSchema } from '@src/controllers/modules/getAllModules.controller';
import { getAllModules } from '@src/controllers/modules/index';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';

const router = Router();

router.get(RouterLinks.getModules, validate(getAllModulesSchema), getAllModules);

export default router;

import { Router } from 'express';
import getAllModules, { getAllModulesSchema } from 'controllers/modules/getAllModules.controller';
import { RouterLinks } from 'constants/links';
import { validate } from 'utils/schema';

const router = Router();

router.get(RouterLinks.getModules, validate(getAllModulesSchema), getAllModules);

export default router;

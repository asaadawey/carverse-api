import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { validate } from 'utils/schema';
import getAllPackages, { getAllPackagesSchema } from 'controllers/packages/getAllPackages.controller';

const router = Router();

router.get(RouterLinks.getPackages, validate(getAllPackagesSchema), getAllPackages);

export default router;

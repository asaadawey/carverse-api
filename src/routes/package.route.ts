import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { validate } from 'src/utils/schema';
import { getAllPackages } from 'src/controllers/packages';
import { getAllPackagesSchema } from 'src/controllers/packages/getAllPackages.controller';

const router = Router();

router.get(RouterLinks.getPackages, validate(getAllPackagesSchema), getAllPackages);

export default router;

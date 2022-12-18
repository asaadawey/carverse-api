import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { getAllServices } from 'controllers/services';
import { validate } from 'utils/schema';
import { getAllServicesSchema } from 'controllers/services/getAllServices.controller';

const router = Router();

router.get(RouterLinks.getAllServices, validate(getAllServicesSchema), getAllServices);

export default router;

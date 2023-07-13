import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { getAllServices } from 'src/controllers/services';
import { validate } from 'src/utils/schema';
import { getAllServicesSchema } from 'src/controllers/services/getAllServices.controller';

const router = Router();

router.get(RouterLinks.getAllServices, validate(getAllServicesSchema), getAllServices);

export default router;

import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { getAllServices, getAllProviderServices } from 'src/controllers/services';
import { validate } from 'src/utils/schema';
import { getAllProviderServicesSchema } from 'src/controllers/services/getAllProviderServices.controller';
import { getAllServicesSchema } from 'src/controllers/services/getAllServices.controller';

const router = Router();

router.get(RouterLinks.getAllProviderServices, validate(getAllProviderServicesSchema), getAllProviderServices);
router.get(RouterLinks.getAllServices, validate(getAllServicesSchema), getAllServices);

export default router;

import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { getAllServices, getAllProviderServices, addService } from '@src/controllers/services/index';
import { validate } from '@src/utils/schema';
import { getAllProviderServicesSchema } from '@src/controllers/services/getAllProviderServices.controller';
import { getAllServicesSchema } from '@src/controllers/services/getAllServices.controller';
import { addServiceSchema } from '@src/controllers/services/addService.controller';

const router = Router();

router.get(RouterLinks.getAllProviderServices, validate(getAllProviderServicesSchema), getAllProviderServices);
router.get(RouterLinks.getAllServices, validate(getAllServicesSchema), getAllServices);
router.post(RouterLinks.addServices, validate(addServiceSchema), addService);

export default router;

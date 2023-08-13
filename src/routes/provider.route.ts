import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { validate } from 'src/utils/schema';

import { getAllProviders, getOneProvider, addProviderService } from 'src/controllers/providers';

import { getAllProvidersSchema } from 'src/controllers/providers/getAllProviders.controller';
import { getOneProviderSchema } from 'src/controllers/providers/getOneProvider.controller';
import { AddProviderServiceSchema } from 'src/controllers/providers/addProviderService.controller';

const router = Router();

router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);
router.get(RouterLinks.getOneProvider, validate(getOneProviderSchema), getOneProvider);
router.post(RouterLinks.addProviderService, validate(AddProviderServiceSchema), addProviderService);

export default router;

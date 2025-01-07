import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { validate } from '@src/utils/schema';

import { getAllProviders, getOneProvider, addProviderService } from '@src/controllers/providers/index';

import { getAllProvidersSchema } from '@src/controllers/providers/getAllProviders.controller';
import { getOneProviderSchema } from '@src/controllers/providers/getOneProvider.controller';
import { upsertProviderServiceschema } from '@src/controllers/providers/upsertProviderService.controller';

const router = Router();

router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);
router.get(RouterLinks.getOneProvider, validate(getOneProviderSchema), getOneProvider);
router.post(RouterLinks.addProviderService, validate(upsertProviderServiceschema), addProviderService);

export default router;

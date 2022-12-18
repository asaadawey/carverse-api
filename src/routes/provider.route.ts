import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { validate } from 'utils/schema';
import { getAllProvidersSchema } from 'controllers/providers/getAllProviders.controller';
import { getAllProviders, getOneProvider } from 'controllers/providers';
import { getOneProviderSchema } from 'controllers/providers/getOneProvider.controller';

const router = Router();

router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);
router.get(RouterLinks.getOneProvider, validate(getOneProviderSchema), getOneProvider);
// router.get("/providers/:id", authMiddleware);
export default router;

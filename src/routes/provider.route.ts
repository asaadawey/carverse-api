import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { validate } from 'src/utils/schema';
import { getAllProvidersSchema } from 'src/controllers/providers/getAllProviders.controller';
import { getAllProviders, getOneProvider } from 'src/controllers/providers';
import { getOneProviderSchema } from 'src/controllers/providers/getOneProvider.controller';

const router = Router();

router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);
router.get(RouterLinks.getOneProvider, validate(getOneProviderSchema), getOneProvider);
// router.get("/providers/:id", authMiddleware);
export default router;

import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { validate } from 'utils/schema';
import getAllProviders, { getAllProvidersSchema } from 'controllers/providers/getAllProviders.controller';

const router = Router();

router.get(RouterLinks.getAllProviders, validate(getAllProvidersSchema), getAllProviders);
// router.get(RouterLinks.getOneProvider, authMiddleware, getOneProvider);
// router.get("/providers/:id", authMiddleware);
export default router;

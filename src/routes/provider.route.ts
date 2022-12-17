import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { getAllProviders, getOneProvider } from 'controllers/provider.controller';
import authMiddleware from 'middleware/auth.middleware';

const router = Router();

router.get(RouterLinks.getProviders, authMiddleware, getAllProviders);
router.get(RouterLinks.getOneProvider, authMiddleware, getOneProvider);
// router.get("/providers/:id", authMiddleware);
export default router;

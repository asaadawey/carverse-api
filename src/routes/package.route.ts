import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { getAllPackages } from 'controllers/package.controller';
import authMiddleware from 'middleware/auth.middleware';

const router = Router();

router.get(RouterLinks.getPackages, authMiddleware, getAllPackages);

export default router;

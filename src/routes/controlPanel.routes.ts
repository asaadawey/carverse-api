import { Router } from 'express';
import flushCacheController, { flushCacheSchema } from '@src/controllers/cache/flushCache.controller';
import requireSuperPasswordMiddleware from '@src/middleware/superPassword.middleware';
import { validate } from '@src/utils/schema';
import { RouterLinks } from '@src/constants/links';

const router = Router();

// POST /admin/flush-cache?pattern=... or header x-super-cache-password
router.post(RouterLinks.flushCache, requireSuperPasswordMiddleware, validate(flushCacheSchema), flushCacheController);

export default router;

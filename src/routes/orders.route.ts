import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { addOrder, getOneOrder } from 'controllers/orders.controller';
import authMiddleware from 'middleware/auth.middleware';

const router = Router();

router.post(RouterLinks.addOrder, authMiddleware, addOrder);
router.get(RouterLinks.getOneOrder, authMiddleware, getOneOrder);

export default router;

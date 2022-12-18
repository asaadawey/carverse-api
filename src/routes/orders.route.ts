import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import addOrder, { addOrderSchema } from 'controllers/orders/addOrder.controller';
import { validate } from 'utils/schema';
import getOneOrder, { getOneOrderSchema } from 'controllers/orders/getOneOrder.controller';

const router = Router();

router.post(RouterLinks.addOrder, validate(addOrderSchema), addOrder);
router.get(RouterLinks.getOneOrder, validate(getOneOrderSchema), getOneOrder);

export default router;

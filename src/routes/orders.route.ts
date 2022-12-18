import { Router } from 'express';
import { RouterLinks } from 'constants/links';

import { addOrder, getOneOrder } from 'controllers/orders';

import { validate } from 'utils/schema';
import { addOrderSchema } from 'controllers/orders/addOrder.controller';
import { getOneOrderSchema } from 'controllers/orders/getOneOrder.controller';

const router = Router();

router.post(RouterLinks.addOrder, validate(addOrderSchema), addOrder);
router.get(RouterLinks.getOneOrder, validate(getOneOrderSchema), getOneOrder);

export default router;

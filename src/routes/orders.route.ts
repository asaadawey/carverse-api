import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';

import { addOrder, getOneOrder, getOrderTotalAmountStatements } from 'src/controllers/orders';

import { validate } from 'src/utils/schema';
import { addOrderSchema } from 'src/controllers/orders/addOrder.controller';
import { getOneOrderSchema } from 'src/controllers/orders/getOneOrder.controller';
import { getOrderTotalAmountStatementsSchema } from 'src/controllers/orders/getOrderTotalAmountStatements.controller';

const router = Router();

router.post(RouterLinks.addOrder, validate(addOrderSchema), addOrder);
router.get(RouterLinks.getOneOrder, validate(getOneOrderSchema), getOneOrder);
router.get(
  RouterLinks.getOrderTotalAmountStatements,
  validate(getOrderTotalAmountStatementsSchema),
  getOrderTotalAmountStatements,
);

export default router;

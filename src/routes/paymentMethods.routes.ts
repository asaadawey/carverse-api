import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { getAllPaymentMethodsSchema } from '@src/controllers/payment/getAllPaymentMethods.controller';
import { getAllPaymentMethods } from '@src/controllers/payment/index';
import { validate } from '@src/utils/schema';

const router = Router();

router.get(RouterLinks.getAllPaymentMethods, validate(getAllPaymentMethodsSchema), getAllPaymentMethods);

export default router;

import express from 'express';

import providerRouter from 'src/routes/provider.route';
import carRouter from 'src/routes/cars.routes';
import orderRouter from 'src/routes/orders.route';
import userRouter from 'src/routes/users.route';
import moduleRouter from 'src/routes/modules.route';
import serviceRouter from 'src/routes/service.route';
import packageRouter from 'src/routes/package.route';
import attachments from 'src/routes/attachments.routes';
import paymentMethods from 'src/routes/paymentMethods.routes';
import constants from 'src/routes/constants.routes';
import { authRoute } from 'src/middleware/auth.middleware';

const router = express.Router();

// Users (login/register) don't need auth
router.use(userRouter);
router.use(attachments);

router.use(authRoute);

router.use(moduleRouter);
router.use(serviceRouter);
router.use(packageRouter);
router.use(providerRouter);
router.use(carRouter);
router.use(orderRouter);
router.use(paymentMethods);
router.use(constants);

export default router;

import express from 'express';

import providerRouter from '@src/routes/provider.routes';
import carRouter from '@src/routes/cars.routes';
import orderRouter from '@src/routes/orders.routes';
import userRouter from '@src/routes/users.routes';
import moduleRouter from '@src/routes/modules.routes';
import dropdownRouter from '@src/routes/dropdown.routes';
import serviceRouter from '@src/routes/service.routes';
import packageRouter from '@src/routes/package.routes';
import attachments from '@src/routes/attachments.routes';
import paymentMethods from '@src/routes/paymentMethods.routes';
import constants from '@src/routes/constants.routes';
import chatRouter from '@src/routes/chat.routes';
import supportRouter from '@src/routes/support.routes';
import { authRoute } from '@src/middleware/auth.middleware';
import adminRouter from '@src/routes/controlPanel.routes';

const router = express.Router();

// Users (login/register) don't need auth
router.use(userRouter);
router.use(attachments);
router.use(dropdownRouter);

router.use(authRoute);

// Admin routes secured by authRoute plus their own secureFlushMiddleware
router.use(adminRouter);

router.use(moduleRouter);
router.use(serviceRouter);
router.use(packageRouter);
router.use(providerRouter);
router.use(carRouter);
router.use(orderRouter);
router.use(paymentMethods);
router.use(constants);
router.use(chatRouter);
router.use(supportRouter);

export default router;

import express from 'express';

import providerRouter from 'routes/provider.route';
import carRouter from 'routes/cars.routes';
import orderRouter from 'routes/orders.route';
import userRouter from 'routes/users.route';
import moduleRouter from 'routes/modules.route';
import serviceRouter from 'routes/service.route';
import packageRouter from 'routes/package.route';
import authMiddleware from 'middleware/auth.middleware';

const router = express.Router();

// Users (login/register) don't need auth
router.use(userRouter);

router.use(authMiddleware);

router.use(moduleRouter);
router.use(serviceRouter);
router.use(packageRouter);
router.use(providerRouter);
router.use(carRouter);
router.use(orderRouter);

export default router;

import express from 'express';

import providerRouter from 'routes/provider.route';
import carRouter from 'routes/cars.routes';
import orderRouter from 'routes/orders.route';
import userRouter from 'routes/users.route';
import moduleRouter from 'routes/modules.route';
import serviceRouter from 'routes/service.route';
import packageRouter from 'routes/package.route';
import authMiddleware from 'middleware/auth.middleware';
import { createFailResponse } from 'responses';
import { HTTPResponses } from 'interfaces/enums';
import envVars from 'config/environment';

const router = express.Router();

// Users (login/register) don't need auth
router.use(userRouter);

router.use(async (req, res, next) => {
  try {
    if (res.headersSent) {
      next();
      return;
    }
    // For testing
    if ((envVars.mode === 'development' || envVars.mode === 'test') && envVars.auth.skipAuth === 'true') {
      req.userId = Number(req.headers['userid']);
    } else {
      req.userId = await authMiddleware(
        req.headers[envVars.auth.authKey] as string,
        req.headers[envVars.allowedClient.key] as string,
      );
    }

    next();
  } catch (error: any) {
    createFailResponse(req, res, error, next, error.message, error.additionalPramater, HTTPResponses.Unauthorised);
  }
});

router.use(moduleRouter);
router.use(serviceRouter);
router.use(packageRouter);
router.use(providerRouter);
router.use(carRouter);
router.use(orderRouter);

export default router;

import express, { Request } from 'express';

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
import authMiddleware from 'src/middleware/auth.middleware';
import { createFailResponse } from 'src/responses';
import { HTTPResponses } from 'src/interfaces/enums';
import envVars from 'src/config/environment';

const router = express.Router();

// Users (login/register) don't need auth
router.use(userRouter);
router.use(attachments);

router.use(async (req: Request, res, next) => {
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

      // req.providerId = Number(req.headers['providerId']) || -1;
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
router.use(paymentMethods);
router.use(constants);

export default router;

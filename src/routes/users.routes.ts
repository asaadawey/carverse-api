import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';

import { validate } from '@src/utils/schema';
import { AllowedClients, UserTypes } from '@src/interfaces/enums';

import { authRoute } from '@src/middleware/auth.middleware';
import allowedUserTypeMiddleware from '@src/middleware/allowedUserType.middleware';
import allowedClientMiddleware from '@src/middleware/allowedClient.middleware';

import { loginController, registerController, checkUserExistController, getUserDetailsController, addDeleteRequestController, processDeleteRequestController } from '@src/controllers/users/index';

import { checkUserExistSchema } from '@src/controllers/users/checkUserExist.controller';
import { getUserDetailsSchema } from '@src/controllers/users/getUserDetails.controller';
import { loginSchema } from '@src/controllers/users/login.controller';
import { registerSchema } from '@src/controllers/users/register.controller';

import { addDeleteRequestSchema } from '@src/controllers/users/addDeleteRequest.controller';
import { processDeleteRequestSchema } from '@src/controllers/users/processDeleteRequest.controller';

const router = Router();

router.post(RouterLinks.login, validate(loginSchema), loginController);
router.post(RouterLinks.register, validate(registerSchema), registerController);
router.post(RouterLinks.checkUserExist, validate(checkUserExistSchema), checkUserExistController);
router.get(RouterLinks.getUserDetails, authRoute, validate(getUserDetailsSchema), getUserDetailsController)
router.post(RouterLinks.addDeleteRequest, authRoute, validate(addDeleteRequestSchema), addDeleteRequestController)
router.get(RouterLinks.processDeleteRequest, authRoute, allowedUserTypeMiddleware([UserTypes.Admin]), allowedClientMiddleware([AllowedClients.Web]), validate(processDeleteRequestSchema), processDeleteRequestController)

export default router;

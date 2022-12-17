import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { loginSchema } from 'controllers/users/login.controller';
import { registerSchema } from 'controllers/users/register.controller';
import { validate } from 'utils/schema';
import { loginController, registerController, checkUserExistController } from 'controllers/users';
import { checkUserExistSchema } from 'controllers/users/checkUserExist.controller';

const router = Router();

router.post(RouterLinks.login, validate(loginSchema), loginController);
router.post(RouterLinks.register, validate(registerSchema), registerController);
router.post(RouterLinks.checkUserExist, validate(checkUserExistSchema), checkUserExistController);

export default router;

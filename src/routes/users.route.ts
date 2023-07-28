import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { loginSchema } from 'src/controllers/users/login.controller';
import { registerSchema } from 'src/controllers/users/register.controller';
import { validate } from 'src/utils/schema';
import { loginController, registerController, checkUserExistController } from 'src/controllers/users';
import { checkUserExistSchema } from 'src/controllers/users/checkUserExist.controller';

const router = Router();

router.post(RouterLinks.login, validate(loginSchema), loginController);
router.post(RouterLinks.register, validate(registerSchema), registerController);
router.post(RouterLinks.checkUserExist, validate(checkUserExistSchema), checkUserExistController);

export default router;

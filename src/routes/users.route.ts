import { Router } from "express";
import { RouterLinks } from "@constants/links";
import { login, registerUser } from "controllers/user.controller";

const router = Router();

router.post(RouterLinks.login, login);
router.post(RouterLinks.register, registerUser);
export default router;

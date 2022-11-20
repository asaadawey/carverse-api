import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import { getAllModules } from "../controllers/modules.controller";
import { RouterLinks } from "../constants/links";

const router = Router();

router.get(RouterLinks.getModules, authMiddleware, getAllModules);

export default router;

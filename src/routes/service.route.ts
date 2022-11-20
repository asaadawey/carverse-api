import { Router } from "express";
import { RouterLinks } from "../constants/links";
import { getAllServices } from "../controllers/service.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

router.get(RouterLinks.getServices, authMiddleware, getAllServices);

export default router;

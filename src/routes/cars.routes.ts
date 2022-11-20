import { Router } from "express";
import { RouterLinks } from "../constants/links";
import {
  addCar,
  getAllBodyTypes,
  getAllCars,
  verifyCarNumber,
} from "../controllers/cars.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

router.get(RouterLinks.getCars, authMiddleware, getAllCars);
router.get(RouterLinks.getBodyTypes, authMiddleware, getAllBodyTypes);
router.post(RouterLinks.addCar, authMiddleware, addCar);
router.post(RouterLinks.verifyCarNumber, authMiddleware, verifyCarNumber);
export default router;

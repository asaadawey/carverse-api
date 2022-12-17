import { Router } from 'express';
import { RouterLinks } from 'constants/links';
import { addCar, getAllBodyTypes, getAllCars } from 'controllers/cars';

import { validate } from 'utils/schema';
import { getAllCarsSchema } from 'controllers/cars/getAllCars.controller';
import { getAllBodyTypesSchema } from 'controllers/cars/getAllBodyTypes.controller';
import { addCarSchema } from 'controllers/cars/addCar.controller';

const router = Router();

router.get(RouterLinks.getCars, validate(getAllCarsSchema), getAllCars);
router.get(RouterLinks.getBodyTypes, validate(getAllBodyTypesSchema), getAllBodyTypes);
router.post(RouterLinks.addCar, validate(addCarSchema), addCar);
// router.post(RouterLinks.verifyCarNumber, authMiddleware, verifyCarNumber);
export default router;

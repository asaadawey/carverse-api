import { Router } from 'express';
import { RouterLinks } from '@src/constants/links';
import { addCar, checkCarExist, getAllBodyTypes, getAllCars } from '@src/controllers/cars/index';

import { validate } from '@src/utils/schema';

import { getAllCarsSchema } from '@src/controllers/cars/getAllCars.controller';
import { getAllBodyTypesSchema } from '@src/controllers/cars/getAllBodyTypes.controller';
import { addCarSchema } from '@src/controllers/cars/addCar.controller';
import { verifyCarNumberSchema } from '@src/controllers/cars/checkCarExist.controller';

const router = Router();

router.get(RouterLinks.getCars, validate(getAllCarsSchema), getAllCars);
router.get(RouterLinks.getBodyTypes, validate(getAllBodyTypesSchema), getAllBodyTypes);
router.post(RouterLinks.addCar, validate(addCarSchema), addCar);
router.get(RouterLinks.verifyCarNumber, validate(verifyCarNumberSchema), checkCarExist);
export default router;

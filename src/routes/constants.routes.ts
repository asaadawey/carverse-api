import { Router } from 'express';
import { RouterLinks } from 'src/constants/links';
import { validate } from 'src/utils/schema';

import { getAllConstants, modifyConstant } from 'src/controllers/constants';

import { getAllConstantsSchema } from 'src/controllers/constants/getAllConstants.controller';
import { modifyConstantSchema } from 'src/controllers/constants/modifyConstant.controller';

const router = Router();

router.get(RouterLinks.getAllConstants, validate(getAllConstantsSchema), getAllConstants);
router.put(RouterLinks.modifyConstant, validate(modifyConstantSchema), modifyConstant);

export default router;

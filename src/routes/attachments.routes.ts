import { Router } from 'express';
import multer from 'multer';
import { RouterLinks } from '@src/constants/links';
import { getAllAttachmentTypesSchema } from '@src/controllers/attachments/getAllAttachmentTypes.controller';
import { getListOfAttachmentsSchema } from '@src/controllers/attachments/getListOfAttachments.controller';
import {
  getAllAttachmentTypes,
  getImage,
  getListOfAttachments,
  uploadAttachments,
} from '@src/controllers/attachments/index';
import { validate } from '@src/utils/schema';
import { uploadAttachmentsSchema } from '@src/controllers/attachments/uploadAttachment.controller';
import { getImageSchema } from '@src/controllers/attachments/getImage.controller';

const memoryStorage = multer({
  storage: multer.memoryStorage(),
});

const router = Router();

router.get(RouterLinks.getAllAttachmentTypes, validate(getAllAttachmentTypesSchema), getAllAttachmentTypes);
router.get(RouterLinks.getListOfAttachments, validate(getListOfAttachmentsSchema), getListOfAttachments);
router.get(RouterLinks.getImage, validate(getImageSchema), getImage);
router.post(
  RouterLinks.uploadAttachments,
  // apiAuthMiddleware,/  // No auth because  it can be  used during registration
  //@ts-ignore
  memoryStorage.single('image'),
  validate(uploadAttachmentsSchema),
  uploadAttachments,
);

export default router;

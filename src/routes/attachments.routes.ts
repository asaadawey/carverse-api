import { Router } from 'express';
import multer from 'multer';
import { RouterLinks } from 'src/constants/links';
import { getAllAttachmentTypesSchema } from 'src/controllers/attachments/getAllAttachmentTypes.controller';
import { getListOfAttachmentsSchema } from 'src/controllers/attachments/getListOfAttachments.controller';
import { getAllAttachmentTypes, getListOfAttachments, uploadAttachments } from 'src/controllers/attachments';
import { validate } from 'src/utils/schema';
import { uploadAttachmentsSchema } from 'src/controllers/attachments/uploadAttachment.controller';

const memoryStorage = multer({
  storage: multer.memoryStorage(),
});

const router = Router();

router.get(RouterLinks.getAllAttachmentTypes, validate(getAllAttachmentTypesSchema), getAllAttachmentTypes);
router.get(RouterLinks.getListOfAttachments, validate(getListOfAttachmentsSchema), getListOfAttachments);
router.post(
  RouterLinks.uploadAttachments,
  memoryStorage.single('image'),
  validate(uploadAttachmentsSchema),
  uploadAttachments,
);

export default router;

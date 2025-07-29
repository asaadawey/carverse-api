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

/**
 * @swagger
 * /attachments/getTypes:
 *   get:
 *     summary: Get all attachment types
 *     description: Retrieve a list of all available attachment types
 *     tags: [Attachments]
 *     responses:
 *       200:
 *         description: Attachment types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           TypeName:
 *                             type: string
 *                             example: "Profile Picture"
 */
router.get(RouterLinks.getAllAttachmentTypes, validate(getAllAttachmentTypesSchema), getAllAttachmentTypes);

/**
 * @swagger
 * /attachments/getListOfAttachments/{typeName}:
 *   get:
 *     summary: Get list of attachments by type
 *     description: Retrieve attachments for a specific type
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: typeName
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment type name
 *     responses:
 *       200:
 *         description: Attachments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           fileName:
 *                             type: string
 *                             example: "profile.jpg"
 *                           url:
 *                             type: string
 *                             example: "https://example.com/profile.jpg"
 */
router.get(RouterLinks.getListOfAttachments, validate(getListOfAttachmentsSchema), getListOfAttachments);

/**
 * @swagger
 * /attachments/getImages:
 *   get:
 *     summary: Get image
 *     description: Retrieve a specific image
 *     tags: [Attachments]
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Image file name
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(RouterLinks.getImage, validate(getImageSchema), getImage);

/**
 * @swagger
 * /attachments/upload/{userId}/{attachmentTypeId}:
 *   post:
 *     summary: Upload attachment
 *     description: Upload a new attachment file
 *     tags: [Attachments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: attachmentTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment type ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         fileName:
 *                           type: string
 *                           example: "uploaded_file.jpg"
 *                         url:
 *                           type: string
 *                           example: "https://example.com/uploaded_file.jpg"
 */
router.post(
  RouterLinks.uploadAttachments,
  // apiAuthMiddleware,/  // No auth because  it can be  used during registration
  //@ts-ignore
  memoryStorage.single('image'),
  validate(uploadAttachmentsSchema),
  uploadAttachments,
);

export default router;

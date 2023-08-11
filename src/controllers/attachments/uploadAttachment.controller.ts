import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { S3 } from '@aws-sdk/client-s3';
import { ResultResponse } from 'src/interfaces/express.types';
import envVars from 'src/config/environment';
import prisma from 'src/helpers/databaseHelpers/client';
import mime from 'mime-db';
import random from 'randomstring';

//#region UploadAttachments
type UploadAttachmentsLinkQuery = {
  userId: string;
  attachmentTypeId: string;
};

type UploadAttachmentsRequestBody = {};

type UploadAttachmentsResponse = ResultResponse;

type UploadAttachmentsQueryParams = { json?: any };

export const uploadAttachmentsSchema: yup.SchemaOf<{
  params: UploadAttachmentsLinkQuery;
  query: UploadAttachmentsQueryParams;
}> = yup.object({
  params: yup.object().shape({
    userId: yup.string().required(),
    attachmentTypeId: yup.string().required(),
  }),
  query: yup.object().shape({
    json: yup.object().optional(),
  }),
});

const uploadAttachments: RequestHandler<
  UploadAttachmentsLinkQuery,
  UploadAttachmentsResponse,
  UploadAttachmentsRequestBody,
  UploadAttachmentsQueryParams
> = async (req, res, next) => {
  try {
    const { attachmentTypeId, userId } = req.params;

    const constructFileName = `${attachmentTypeId}__${userId}__${random.generate(7)}.${
      mime[req.file?.mimetype || '']?.extensions?.[0]
    }`;
    const uploadedFile = await prisma.uploadedFiles.create({
      data: {
        FileName: constructFileName,
        UserID: Number(userId),
        AttachmentID: Number(attachmentTypeId),
        JsonData: req.query?.json && JSON.parse(req.query.json),
      },
      select: {
        id: true,
      },
    });

    const s3 = new S3({ region: envVars.aws.s3Region });

    const awsResult = await s3.putObject({
      Bucket: envVars.aws.s3BucketName,
      Body: req.file?.buffer,
      Key: constructFileName,
    });

    await prisma.uploadedFiles.update({
      data: {
        AWSEtag: awsResult.ETag,
        UploadedAt: new Date(),
      },
      where: {
        id: uploadedFile.id,
      },
    });

    createSuccessResponse(req, res, { result: Boolean(awsResult.$metadata.httpStatusCode === 200) }, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};
//#endregion

export default uploadAttachments;

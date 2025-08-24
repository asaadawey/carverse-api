import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
import { Prisma } from '@prisma/client';

//#region GetListOfAttachments
type GetListOfAttachmentsLinkQuery = {
  typeName: string;
};

type GetListOfAttachmentsRequestBody = {};

type GetListOfAttachmentsResponse = {
  Description: string;
  id: number;
  Name: string;
  isRequired: boolean;
  canUploadFromCamera: boolean;
  canUploadFromGallery: boolean;
  allowMultiple: boolean;
}[];

type GetListOfAttachmentsQueryParams = {
  skipRetrivingAlreadyUploaded?: string;
  jsonSearch?: string;
  userId: string;
};

export const getListOfAttachmentsSchema: yup.SchemaOf<{
  params: GetListOfAttachmentsLinkQuery;
  query: GetListOfAttachmentsQueryParams;
}> = yup.object({
  params: yup.object().shape({
    typeName: yup.string().required(),
  }),
  query: yup.object().shape({
    userId: yup.string().required(),
    jsonSearch: yup.string().optional(),
    skipRetrivingAlreadyUploaded: yup.string().optional(),
  }),
});

const GetListOfAttachments: RequestHandler<
  GetListOfAttachmentsLinkQuery,
  GetListOfAttachmentsResponse,
  GetListOfAttachmentsRequestBody,
  GetListOfAttachmentsQueryParams
> = async (req, res, next) => {
  try {
    const { typeName } = req.params;
    const { skipRetrivingAlreadyUploaded, jsonSearch, userId } = req.query;

    let attachments = await req.prisma.attachments.findMany({
      where: {
        attachmentType: {
          TypeName: {
            equals: typeName,
          },
        },
      },
      select: {
        id: true,
        TypeID: true,
        Description: true,
        Name: true,
        isRequired: true,
        canUploadFromCamera: true,
        canUploadFromGallery: true,
        allowMultiple: true,
      },
    });

    function safeParse(str) {
      let parsed = str;
      while (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          break;
        }
      }
      return parsed;
    }

    if (skipRetrivingAlreadyUploaded !== 'true') {
      let whereClause: Prisma.uploadedFilesWhereInput = {
        user: {
          id: Number(userId),
        },
        attachment: {
          attachmentType: {
            TypeName: { equals: typeName },
          },
        },
      };

      if (jsonSearch) {
        const json = safeParse(jsonSearch);
        whereClause.JsonData = {
          path: [Object.keys(json)[0] || ''],
          equals: json[Object.keys(json)[0]],
        };
      }

      const uploadedFiles = await req.prisma.uploadedFiles.findMany({
        where: whereClause,
        select: {
          attachment: {
            select: {
              id: true,
              TypeID: true,
            },
          },
        },
      });

      attachments = attachments.filter((attachment) => {
        const isAttachmentFound = uploadedFiles.some((uploadedFile) => uploadedFile.attachment.id === attachment.id);
        return !isAttachmentFound;
      });
    }

    createSuccessResponse(req, res, attachments || [], next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default GetListOfAttachments;

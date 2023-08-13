import prisma from 'src/helpers/databaseHelpers/client';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region GetListOfAttachments
type GetListOfAttachmentsLinkQuery = {
  typeName: string;
};

type GetListOfAttachmentsRequestBody = {};

type GetListOfAttachmentsResponse = {
  Description: string;
  id: number;
  Name: string;
}[];

type GetListOfAttachmentsQueryParams = {};

export const getListOfAttachmentsSchema: yup.SchemaOf<{ params: GetListOfAttachmentsLinkQuery }> = yup.object({
  params: yup.object().shape({
    typeName: yup.string().required(),
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
    const attachments = await prisma.attachments.findMany({
      where: {
        attachmentType: {
          TypeName: {
            equals: typeName,
          },
        },
      },
      select: { id: true, Description: true, Name: true },
    });
    createSuccessResponse(req, res, attachments || [], next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default GetListOfAttachments;

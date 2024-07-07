import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region GetAllAttachmentTypes
type GetAllAttachmentTypesLinkQuery = {};

type GetAllAttachmentTypesRequestBody = {};

type GetAllAttachmentTypesResponse = {
  TypeName: string;
  id: number;
}[];

type GetAllAttachmentTypesQueryParams = {};

export const getAllAttachmentTypesSchema: yup.SchemaOf<{}> = yup.object({});

const getAllAttachmentTypes: RequestHandler<
  GetAllAttachmentTypesLinkQuery,
  GetAllAttachmentTypesResponse,
  GetAllAttachmentTypesRequestBody,
  GetAllAttachmentTypesQueryParams
> = async (req, res, next) => {
  try {
    const attachemntTypes = await req.prisma.attachmentTypes.findMany({
      select: { TypeName: true, id: true },
    });
    createSuccessResponse(req, res, attachemntTypes, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getAllAttachmentTypes;

import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import envVars from 'src/config/environment';
import { GetObjectCommand, GetObjectCommandInput, S3Client } from '@aws-sdk/client-s3';

//#region GetImage
type GetImageLinkQuery = {
    jsonEquals?: string;
    attachmentIdIn?: string
};

type GetImageRequestBody = {};

type GetImageResponse = {
    url: string;
    name: string;
}[];

type GetImageQueryParams = { jsonEquals?: any; attachmentIdIn?: any; };

export const getImageSchema: yup.SchemaOf<{
    query: GetImageQueryParams;
}> = yup.object({
    query: yup.object().shape({
        jsonEquals: yup.string().optional(),
        attachmentIdIn: yup.string().optional(),
    }).test({
        message: 'There must be at least one supported query',
        test: (obj: any) => obj.jsonEquals || obj.attachmentIdIn,
    }),
});

const getImage: RequestHandler<
    GetImageLinkQuery,
    GetImageResponse,
    GetImageRequestBody,
    GetImageQueryParams
> = async (req, res, next) => {
    try {

        const decodedJsonQuery: any[] = req.query.jsonEquals && JSON.parse(decodeURIComponent(req.query.jsonEquals));

        const decodedAttachmentsIn: any[] = req.query.attachmentIdIn && JSON.parse(decodeURIComponent(req.query.attachmentIdIn));

        const attachmentsFound = await req.prisma.uploadedFiles.findMany({
            where: {
                OR: [
                    ...decodedJsonQuery?.map?.((json: any) => (
                        { JsonData: { path: [Object.keys(json || {})?.[0]], equals: json?.[Object.keys(json || {})?.[0]] } }
                    )) || [],
                    { AttachmentID: { in: decodedAttachmentsIn } }
                ]
            },
            select: {
                FileName: true,
                attachment: {
                    select: {
                        Name: true
                    }
                }
            }
        })


        const s3client = new S3Client({ region: envVars.aws.s3Region });
        let result: GetImageResponse = [];

        for (let attachment of attachmentsFound) {
            const params: GetObjectCommandInput = {
                Key: attachment.FileName,
                Bucket: envVars.aws.s3BucketName,
            };

            const command = new GetObjectCommand(params)
            const url = await getSignedUrl(s3client, command, { expiresIn: 30 })

            result.push({
                name: attachment.attachment.Name,
                url,
            })
        }


        createSuccessResponse(req, res, result, next);
    } catch (error: any) {
        createFailResponse(req, res, error, next);
    }
};
//#endregion

export default getImage;
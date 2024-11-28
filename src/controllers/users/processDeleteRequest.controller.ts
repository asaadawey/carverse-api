import { RequestHandler } from 'express';
import { HttpException } from 'src/errors';
import { HTTPErrorString, HTTPResponses, UserTypes } from 'src/interfaces/enums';
import { ResultResponse } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region ProcessDeleteRequest
type ProcessDeleteRequestRequestQuery = {};

type ProcessDeleteRequestResponse = ResultResponse;

type ProcessDeleteRequestRequestBody = {

};

type ProcessDeleteRequestRequestParams = { deleteRequestId: string; };

export const processDeleteRequestSchema: yup.SchemaOf<{ params: ProcessDeleteRequestRequestParams, body: ProcessDeleteRequestRequestBody }> = yup.object({
    params: yup.object({
        deleteRequestId: yup.string().required()
    }),
    body: yup.object({

    })
});

const processDeleteRequest: RequestHandler<
    ProcessDeleteRequestRequestParams,
    ProcessDeleteRequestResponse,
    ProcessDeleteRequestRequestBody,
    ProcessDeleteRequestRequestQuery
> = async (req, res, next) => {
    try {
        const deleteRequest = await req.prisma.deleteRequests.update({
            data: {
                processedByUser: {
                    connect: {
                        id: req.user.id
                    }
                },
                ProcessedOn: new Date(),
                IsProcessed: true,
                user: {
                    update: {
                        isActive: false
                    }
                }
            }, where: {
                id: Number(req.params.deleteRequestId)
            }, select: {
                id: true,
            }
        })


        createSuccessResponse(req, res, { createdItemId: deleteRequest.id, result: Boolean(deleteRequest) }, next);
    } catch (error: any) {
        createFailResponse(req, res, error, next);
    }
};

//#endregion

export default processDeleteRequest;

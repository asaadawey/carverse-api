import { RequestHandler } from 'express';
import { HttpException } from 'src/errors';
import { HTTPErrorString, HTTPResponses, UserTypes } from 'src/interfaces/enums';
import { ResultResponse } from 'src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from 'src/responses';
import * as yup from 'yup';

//#region AddDeleteRequest
type AddDeleteRequestRequestQuery = {};

type AddDeleteRequestResponse = ResultResponse;

type AddDeleteRequestRequestBody = {
    comments?: string;
};

type AddDeleteRequestRequestParams = { userId?: string; };

export const addDeleteRequestSchema: yup.SchemaOf<{ params: AddDeleteRequestRequestParams, body: AddDeleteRequestRequestBody }> = yup.object({
    params: yup.object({
        userId: yup.string().optional()
    }),
    body: yup.object({
        comments: yup.string().optional()
    })
});

const AddDeleteRequest: RequestHandler<
    AddDeleteRequestRequestParams,
    AddDeleteRequestResponse,
    AddDeleteRequestRequestBody,
    AddDeleteRequestRequestQuery
> = async (req, res, next) => {
    try {
        const isRequestorAdmin = req.user.userType === UserTypes.Admin
        if (req.params.userId && !isRequestorAdmin)
            throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, "body passed is not authorised")

        const { comments } = req.body;

        const user = await req.prisma.deleteRequests.create({
            data: {
                Comments: comments,
                UserID: Number(req.params.userId) || req.user.id,
                DeletedBy: req.user.id,
                // Process it instantly if the logged in is admin
                IsProcessed: isRequestorAdmin,
                ProcessedBy: isRequestorAdmin ? req.user.id : undefined,
                ProcessedOn: isRequestorAdmin ? new Date() : undefined,
            }
        });

        if (isRequestorAdmin) {
            // Deactive the user instantly
            await req.prisma.users.update({
                where: {
                    id: Number(req.params.userId)
                },
                data: {
                    isActive: false,
                }
            })
        }

        createSuccessResponse(req, res, { createdItemId: user.id, result: Boolean(user) }, next);
    } catch (error: any) {
        createFailResponse(req, res, error, next);
    }
};

//#endregion

export default AddDeleteRequest;

import { RequestHandler } from 'express';
import { HttpException } from '@src/errors/index';
import { HTTPErrorString, HTTPResponses, UserTypes } from '@src/interfaces/enums';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';

//#region GetUserDetails
type GetUserDetailsRequestQuery = {};

type GetUserDetailsResponse = {
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber: string;
} | {};

type GetUserDetailsRequestBody = {

};

type GetUserDetailsRequestParams = { userId?: string; };

export const getUserDetailsSchema: yup.SchemaOf<{ params: GetUserDetailsRequestParams }> = yup.object({ params: yup.object({ userId: yup.string().optional() }) });

const getUserDetails: RequestHandler<
    GetUserDetailsRequestParams,
    GetUserDetailsResponse,
    GetUserDetailsRequestBody,
    GetUserDetailsRequestQuery
> = async (req, res, next) => {
    try {
        if (req.params.userId && req.user.userType !== UserTypes.Admin)
            throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, "body passed is not authorised")

        const user = await req.prisma.users.findUnique({
            where: {
                id: Number(req.params.userId) || req.user.id
            },
            select: {
                FirstName: true,
                LastName: true,
                Email: true,
                PhoneNumber: true,
            }
        }) || {};

        createSuccessResponse(req, res, { ...user }, next);
    } catch (error: any) {
        createFailResponse(req, res, error, next);
    }
};

//#endregion

export default getUserDetails;

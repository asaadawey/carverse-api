// This function is to decrypt allowed client
// Can be used as middleware

import { Request, RequestHandler } from "express";
import { AllowedClients, HTTPErrorString, HTTPResponses } from "@src/interfaces/enums";
import { decrypt } from "@src/utils/encrypt";
import envVars from '@src/config/environment';
import { createFailResponse } from "@src/responses/index";
import { HttpException } from "@src/errors/index";


export const getAllowedClient = (req: Request): AllowedClients | undefined => {
    const allowedClient = req.header(envVars.allowedClient.key)
    if (allowedClient)
        return decrypt(allowedClient) as AllowedClients;
}

export default (allowed: AllowedClients[]): RequestHandler => (req, res, next) => {
    try {
        const result = allowed.some(allowed => allowed === getAllowedClient(req))
        if (!result)
            throw new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI, "Not allowed client")

        next();
    } catch (error: any) {
        createFailResponse(req, res, error, next, HTTPResponses.Unauthorised);
    }
}
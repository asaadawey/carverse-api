import { RequestHandler } from 'express';
import { ResultResponse } from '@src/interfaces/express.types';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import * as yup from 'yup';
//#region AddService
type AddServiceParams = {

};

type AddServiceRequestBody = {
    serviceName: string;
    serviceDescription: string;
    moduleId: number;
};

type AddServiceResponse = ResultResponse;

type AddServiceQuery = {
};

export const addServiceSchema: yup.SchemaOf<{ body: AddServiceRequestBody }> =
    yup.object({
        body: yup.object().shape({
            moduleId: yup.number().required().min(1),
            serviceDescription: yup.string().required(),
            serviceName: yup.string().required()
        }),
    });

const addService: RequestHandler<
    AddServiceParams,
    AddServiceResponse,
    AddServiceRequestBody,
    AddServiceQuery
> = async (req, res, next) => {
    try {
        const { serviceDescription, serviceName, moduleId } = req.body;

        const createdService = await req.prisma.services.create({
            data: {
                ServiceDescription: serviceDescription,
                ServiceIconLink: "",
                ServiceName: serviceName,
                ModuleID: moduleId
            },
            select: {
                id: true
            }
        })

        createSuccessResponse(req, res, { result: true, createdItemId: createdService.id }, next);
    } catch (error: any) {
        createFailResponse(req, res, error, next);
    }
};
//#endregion

export default addService;
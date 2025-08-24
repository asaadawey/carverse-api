import * as yup from 'yup';
import { RequestHandler } from 'express';
import { createFailResponse, createSuccessResponse } from '@src/responses/index';
import envVars from '@src/config/environment';
import axios from 'axios';

//#region GetDropdownValues

type GetDropdownValuesLinkQuery = {};

type GetDropdownValuesRequestBody = {};

// Generic dropdown response shape. Adjust fields when implementing logic.
type GetDropdownValuesResponse = { id?: number; value?: string }[];

type GetDropdownValuesQueryParams = {
  param1: string;
  param2?: string;
};

export const getDropdownValuesSchema: yup.SchemaOf<{
  query: GetDropdownValuesQueryParams;
}> = yup.object({
  query: yup.object().shape({ param1: yup.string().required('Param1 is required'), param2: yup.string().optional() }),
});

const getDropdownValues: RequestHandler<
  GetDropdownValuesLinkQuery,
  GetDropdownValuesResponse,
  GetDropdownValuesRequestBody,
  GetDropdownValuesQueryParams
> = async (req, res, next) => {
  try {
    let result: GetDropdownValuesResponse = [];

    const { param1, param2 } = req.query;

    switch (param1) {
      case 'carMakes':
        const values = await axios.get(envVars.carQuery.makesUrl);
        result = values.data.Makes.map((make: any) => ({
          id: make.make_id,
          value: make.make_display,
        }));
        break;

      case 'carModels':
        if (!param2) break;

        const modelValues = await axios.get(envVars.carQuery.modelsUrl + param2);
        result = modelValues.data.Models.map((model: any) => ({
          id: model.model_name,
          value: model.model_name,
        }));
        break;

      default:
        break;
    }

    createSuccessResponse(req, res, result, next);
  } catch (error: any) {
    createFailResponse(req, res, error, next);
  }
};

//#endregion

export default getDropdownValues;

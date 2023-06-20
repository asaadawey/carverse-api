import { NextFunction, Request, Response } from 'express';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import createFailResponse from 'responses/failure';
import * as yup from 'yup';

export const validate =
  (schema: yup.ObjectSchema<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      let modifiedSchema = yup.object({
        body: yup.object({}).concat(schema.fields.body).noUnknown(true).strict(),
        query: yup.object({}).concat(schema.fields.query).noUnknown(true).strict(),
        params: yup.object({}).concat(schema.fields.params).noUnknown(true).strict(),
      });
      await modifiedSchema.validate({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: any) {
      createFailResponse(req, res, error, next, HTTPResponses.ValidationError, HTTPErrorString.BadRequest, '');
    }
  };

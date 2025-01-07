import { NextFunction, Request, Response } from 'express';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import createFailResponse from '@src/responses/failure';
import * as yup from 'yup';

export const validate =
  (schema: yup.ObjectSchema<any, any>) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sharedSchema = {
        query: yup.object().shape({
          isActive: yup.string().optional().oneOf(['true', 'false', 'any'])
        }),
        body: yup.object(),
        params: yup.object()
      }

      let modifiedSchema = yup.object({
        body: yup.object({}).concat(schema.fields.body).concat(sharedSchema.body).noUnknown(true).strict(),
        query: yup.object({}).concat(schema.fields.query).concat(sharedSchema.query).noUnknown(true).strict(),
        params: yup.object({}).concat(schema.fields.params).concat(sharedSchema.params).noUnknown(true).strict(),
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

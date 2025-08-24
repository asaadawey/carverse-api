import { RequestHandler } from 'express';
import { clearCache, clearCachePattern } from '@src/middleware/cache.middleware';
import { createSuccessResponse, createFailResponse } from '@src/responses/index';
import * as yup from 'yup';

export const flushCacheSchema = yup.object().shape({
  body: yup.object().shape({}),
  query: yup.object().shape({
    pattern: yup.string().optional(),
    super_secret_password: yup.string().optional(),
  }),
  params: yup.object().shape({}),
});

// Secure flush cache controller - only allowed when super password provided by middleware
const flushCacheController: RequestHandler = async (req, res, next) => {
  try {
    // Optional pattern
    const pattern = req.query.pattern as string;

    if (pattern) {
      clearCachePattern(pattern);
    } else {
      clearCache();
    }

    return createSuccessResponse(req, res, { message: 'Cache flushed', pattern: pattern || 'all' }, next);
  } catch (error) {
    return createFailResponse(req, res, error, next);
  }
};

export default flushCacheController;

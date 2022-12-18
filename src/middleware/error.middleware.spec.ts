import { createFailResponse } from 'responses';
import errorMiddleware from './error.middleware';
import httpMocks from 'node-mocks-http';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import envVars from 'config/environment';

describe('error.middleware', () => {
  it('Should success and call res.json', () => {
    global.mockRes.status = jest.fn(() => {});
    errorMiddleware(
      new HttpException(HTTPResponses.BusinessError, HTTPErrorString.BadRequest, 'I am additional'),
      global.mockReq,
      global.mockRes,
      global.mockNext,
    );

    expect(global.mockRes.status).toHaveBeenCalledWith(HTTPResponses.BusinessError);
  });
});

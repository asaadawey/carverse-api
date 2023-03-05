import { createFailResponse } from 'responses';
import apiAuthMiddleware from './apiAuth.middleware';
import httpMocks from 'node-mocks-http';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import envVars from 'config/environment';

describe('apiAuth.middleware', () => {
  it('Should fail becuase no auth key is passed', async () => {
    let req = httpMocks.createRequest({
      headers: {},
    });

    await apiAuthMiddleware(req, global.mockRes, global.mockNext);
    expect(createFailResponse).toBeCalledWith(
      req,
      global.mockRes,
      new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI),
      global.mockNext,
    );
  });

  it('Should fail becuase auth key is passed but its incorrect', async () => {
    let req = httpMocks.createRequest({
      headers: {
        [envVars.auth.apiKey]: 'WRONG KEY',
      },
    });

    await apiAuthMiddleware(req, global.mockRes, global.mockNext);
    expect(createFailResponse).toBeCalledWith(
      req,
      global.mockRes,
      new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedAPI),
      global.mockNext,
    );
  });

  it('Should succeed', async () => {
    let req = httpMocks.createRequest({
      headers: commonHeaders(),
    } as any);

    await apiAuthMiddleware(req, global.mockRes, global.mockNext);
    expect(global.mockNext).toBeCalled();
  });
});

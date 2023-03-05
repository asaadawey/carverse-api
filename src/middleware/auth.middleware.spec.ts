import { createFailResponse } from 'responses';
import authMiddleware from './auth.middleware';
import httpMocks from 'node-mocks-http';
import { HttpException } from 'errors';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import envVars from 'config/environment';
import { decode, verify } from 'jsonwebtoken';
import { DeepMockProxy } from 'jest-mock-extended';
import { tokens } from 'interfaces/token.types';

jest.mock('jsonwebtoken');

describe('auth.middleware', () => {
  it('Should fail becuase no auth token is passed', async () => {
    let req = httpMocks.createRequest({
      headers: {},
    });

    await authMiddleware(req, global.mockRes, global.mockNext);
    expect(createFailResponse).toBeCalledWith(
      req,
      global.mockRes,
      new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'No token provided'),
      global.mockNext,
    );
  });

  it('Should fail becuase auth token is passed but its incorrect(name is incorrect)', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    let req = httpMocks.createRequest({
      headers: {
        [envVars.auth.authKey]: 'WRONG KEY',
      },
    });
    (verify as DeepMockProxy<any>).mockReturnValue({
      name: 'Wrong name',
    });
    await authMiddleware(req, global.mockRes, global.mockNext);
    expect(createFailResponse).toBeCalledWith(
      req,
      global.mockRes,
      new HttpException(
        HTTPResponses.Unauthorised,
        HTTPErrorString.UnauthorisedToken,
        'Token exist and active but not name doesnt match ' + tokens.name,
      ),
      global.mockNext,
    );
  });

  it('Should fail becuase auth token is expired', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    let req = httpMocks.createRequest({
      headers: {
        [envVars.auth.authKey]: 'RIGHT KEY',
      },
    });
    (verify as DeepMockProxy<any>).mockReturnValue({
      name: envVars.appName,
    });
    (decode as DeepMockProxy<any>).mockReturnValue({
      exp: 11, //Past time
    });
    await authMiddleware(req, global.mockRes, global.mockNext);
    expect(createFailResponse).toBeCalledWith(
      req,
      global.mockRes,
      new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, 'Token expired'),
      global.mockNext,
    );
  });

  it('Should success', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    let req = httpMocks.createRequest({
      headers: {
        [envVars.auth.authKey.toLowerCase()]: 'RIGHT KEY',
      },
    });
    (verify as DeepMockProxy<any>).mockReturnValue({
      name: envVars.appName,
      id: 1,
    });
    (decode as DeepMockProxy<any>).mockReturnValue({
      exp: new Date().getTime() + 1000000, //Past time
    });
    await authMiddleware(req, global.mockRes, global.mockNext);
    expect(global.mockNext).toBeCalled();
  });
});

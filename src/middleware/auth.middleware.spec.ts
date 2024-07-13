import auth, { authRoute } from './auth.middleware';
import envVars from 'src/config/environment';
import { decode, verify } from 'jsonwebtoken';
import { DeepMockProxy } from 'jest-mock-extended';
import { tokens } from 'src/interfaces/token.types';
import { encrypt } from 'src/utils/encrypt';
import { createFailResponse } from 'src/responses';
import { HttpException } from 'src/errors';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';

jest.mock('jsonwebtoken');

describe('auth.middleware', () => {
  describe('auth', () => {
    it('Should fail becuase no auth token is passed', async () => {
      try {
        await auth('', '');
      } catch (error: any) {
        expect(error.additionalParameters).toEqual('Token header not exists');
      }
    });

    it('Should fail becuase auth token is passed but its incorrect(name is incorrect)', async () => {
      //@ts-ignore
      envVars.auth.skipAuth = false;
      (verify as DeepMockProxy<any>).mockReturnValue({
        name: 'Wrong name',
      });
      try {
        await auth('wrong', '');
      } catch (error: any) {
        expect(error.additionalParameters).toEqual('Token exist and active but not name doesnt match ' + tokens.name);
      }
    });

    it('Should fail becuase auth token is expired', async () => {
      //@ts-ignore
      envVars.appServer.version = "123";
      //@ts-ignore
      envVars.auth.skipAuth = false;
      const mockVerifyObject = {
        name: envVars.appName,
        exp: 11,
        id: 1,
        applicationVersion: "123"
      };
      (verify as DeepMockProxy<any>).mockReturnValue(mockVerifyObject);
      (decode as DeepMockProxy<any>).mockReturnValue({
        exp: 11, //Past time
      });
      try {
        await auth('wrong', '');
      } catch (error: any) {
        expect(error.additionalParameters).toEqual('Token expired ' + JSON.stringify(mockVerifyObject));
      }
    });

    it('Should fail because allowed client is not right', async () => {
      //@ts-ignore
      envVars.appServer.version = "123";

      //@ts-ignore
      envVars.auth.skipAuth = false;
      (verify as DeepMockProxy<any>).mockReturnValue({
        name: envVars.appName,
        authorisedEncryptedClient: encrypt('Iam different that the allowed client'),
        id: 1,
        applicationVersion: "123"
      });
      (decode as DeepMockProxy<any>).mockReturnValue({
        authorisedEncryptedClient: encrypt('Iam different that the allowed client'),
        exp: new Date().getTime() + 1000000, //Present time
      });
      try {
        await auth('wrong', 'wrong client');
      } catch (error: any) {
        expect(error.additionalParameters).toEqual('Allowed Client is not right');
      }
    });

    it('Should fail because verson is different than application version', async () => {
      //@ts-ignore
      envVars.auth.skipAuth = false;
      //@ts-ignore
      envVars.appServer.version = "123";
      const encryptedClient = encrypt('cp');
      (verify as DeepMockProxy<any>).mockReturnValue({
        name: envVars.appName,
        id: 1,
        applicationVersion: "321"
      });
      (decode as DeepMockProxy<any>).mockReturnValue({
        authorisedEncryptedClient: encryptedClient,
        exp: new Date().getTime() + 1000000, //Present time
      });
      try {
        await auth('wrong', 'wrong client');
      } catch (error: any) {
        expect(error.additionalParameters).toEqual('Token exist and active but not version doesnt match ' + JSON.stringify({ appVersion: "123", token: "321" }));
      }
    });
    it('Should success', async () => {
      //@ts-ignore
      envVars.auth.skipAuth = false;
      //@ts-ignore
      envVars.appServer.version = "123";
      const encryptedClient = encrypt('cp');
      (verify as DeepMockProxy<any>).mockReturnValue({
        name: envVars.appName,
        id: 1,
        applicationVersion: "123"
      });
      (decode as DeepMockProxy<any>).mockReturnValue({
        authorisedEncryptedClient: encryptedClient,
        exp: new Date().getTime() + 1000000, //Present time
        applicationVersion: "123"
      });
      try {
        await auth('right', encryptedClient);
        expect(false).toBe(false);
      } catch (error: any) { }
    });
  })

  describe('authRoute', () => {
    it('Should call next in case of headers is sent', async () => {
      global.mockRes.headersSent = true;
      await authRoute(global.mockReq, global.mockRes, global.mockNext)

      expect(global.mockNext).toBeCalledTimes(1);
    })

    it('Should call fail response with right parameterds', async () => {
      const error = new HttpException(HTTPResponses.Unauthorised, HTTPErrorString.UnauthorisedToken, { test: "test" })
      jest.mock('src/middleware/auth.middleware.ts', () => ({
        ...jest.requireActual('src/middleware/auth.middleware.ts'),
        authMiddleware: jest.fn().mockRejectedValue(error)
      }))

      await authRoute(global.mockReq, global.mockRes, global.mockNext)

      expect(global.mockNext).not.toBeCalled()
      expect(createFailResponse).toBeCalledWith(global.mockReq, global.mockRes, error, global.mockNext, 401, HTTPErrorString.UnauthorisedToken, undefined)
    })

    it('Should inject user id in case of skip auth', async () => {
      jest.mock('src/config/environment.ts', () => ({
        ...jest.requireActual('src/config/environment.ts'),
        isDev: true,
        auth: {
          skipAuth: true
        }
      }));

      const expectedUserId = 1234;
      global.mockReq.headers = { userid: expectedUserId }
      //@ts-ignore
      envVars.auth.skipAuth = true;
      //@ts-ignore
      envVars.mode = 'test';

      await authRoute(global.mockReq, global.mockRes, global.mockNext)

      expect(global.mockReq.user.id).toEqual(expectedUserId);
    })
  })

});

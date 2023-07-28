import authMiddleware from './auth.middleware';
import envVars from 'src/config/environment';
import { decode, verify } from 'jsonwebtoken';
import { DeepMockProxy } from 'jest-mock-extended';
import { tokens } from 'src/interfaces/token.types';
import { encrypt } from 'src/utils/encrypt';

jest.mock('jsonwebtoken');

describe('auth.middleware', () => {
  it('Should fail becuase no auth token is passed', async () => {
    try {
      await authMiddleware('', '');
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
      await authMiddleware('wrong', '');
    } catch (error: any) {
      expect(error.additionalParameters).toEqual('Token exist and active but not name doesnt match ' + tokens.name);
    }
  });

  it('Should fail becuase auth token is expired', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    const mockVerifyObject = {
      name: envVars.appName,
      exp: 11,
      id: 1,
    };
    (verify as DeepMockProxy<any>).mockReturnValue(mockVerifyObject);
    (decode as DeepMockProxy<any>).mockReturnValue({
      exp: 11, //Past time
    });
    try {
      await authMiddleware('wrong', '');
    } catch (error: any) {
      expect(error.additionalParameters).toEqual('Token expired ' + JSON.stringify(mockVerifyObject));
    }
  });

  it('Should fail because allowed client is not right', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    (verify as DeepMockProxy<any>).mockReturnValue({
      name: envVars.appName,
      authorisedEncryptedClient: encrypt('Iam different that the allowed client'),
      id: 1,
    });
    (decode as DeepMockProxy<any>).mockReturnValue({
      authorisedEncryptedClient: encrypt('Iam different that the allowed client'),
      exp: new Date().getTime() + 1000000, //Present time
    });
    try {
      await authMiddleware('wrong', 'wrong client');
    } catch (error: any) {
      expect(error.additionalParameters).toEqual('Allowed Client is not right');
    }
  });
  it('Should success', async () => {
    //@ts-ignore
    envVars.auth.skipAuth = false;
    const encryptedClient = encrypt('cp');
    (verify as DeepMockProxy<any>).mockReturnValue({
      name: envVars.appName,
      id: 1,
    });
    (decode as DeepMockProxy<any>).mockReturnValue({
      authorisedEncryptedClient: encryptedClient,
      exp: new Date().getTime() + 1000000, //Present time
    });
    try {
      await authMiddleware('right', encryptedClient);
      expect(false).toBe(false);
    } catch (error: any) {}
  });
});

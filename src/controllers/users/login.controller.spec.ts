import login from './login.controller';
import { DeepMockProxy } from 'jest-mock-extended';
import { sign } from 'jsonwebtoken';
import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import { HttpException } from 'src/errors';
import { createSuccessResponse, createFailResponse } from 'src/responses';
import { HTTPErrorMessages, HTTPResponses } from 'src/interfaces/enums';
import { encrypt, generateHashedString } from 'src/utils/encrypt';

jest.mock('jsonwebtoken');

describe('users/login', () => {
  beforeEach(() => {
    //Mock sign
    (sign as DeepMockProxy<any>).mockReturnValue('Test');
  });

  it('Should return fail because password is incorrect', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({ Password: await generateHashedString("d"), });

    global.mockReq.body = { email: '1', password: '1' };

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(
        HTTPResponses.BusinessError,
        HTTPErrorMessages.InvalidUsernameOrPassowrd,
        'password is incorrect',
      ),
      global.mockNext,
    );
  });

  it('Should return fail because no user found', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue();

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,

      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.InvalidUsernameOrPassowrd, 'No user found'),
      global.mockNext,
    );
  });

  it('Should return fail because allowed clients is not right', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({
      Password: await generateHashedString("1"),
      userTypes: {
        AllowedClients: ['cp'],
      },
    });

    global.mockReq.body = { email: '1', password: '1', encryptedClient: 'Not right client' };

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,

      new HttpException(HTTPResponses.BusinessError, HTTPErrorMessages.NoSufficientPermissions, expect.any(Object)),
      global.mockNext,
    );
  });

  it('Should succeed', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      Email: '1',
      Password: await generateHashedString("1"),
      userTypes: {
        AllowedClients: ['cp'],
      },
      isActive: true,
    });
    global.mockReq.body = { email: '1', password: '1', encryptedClient: encrypt('cp') };

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.anything(),
      global.mockNext,
    );
  });

  it('Should succeed and return isUserActive as atrue', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      Email: '1',
      Password: await generateHashedString("1"),
      userTypes: {
        AllowedClients: ['cp'],
      },
      isActive: true,
    });
    global.mockReq.body = { email: '1', password: '1', encryptedClient: encrypt('cp') };

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.objectContaining({
        isUserActive: true,
      }),
      global.mockNext,
    );
  });
  it('Should succeed and return isUserActive as true and document fullfilled true', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      Email: '1',
      Password: await generateHashedString("1"),
      userTypes: {
        AllowedClients: ['cp'], TypeName: "Provider"
      },
      isActive: false,
    });
    prismaMock.uploadedFiles.findFirst.mockResolvedValue({
      test: "Test"
    })
    global.mockReq.body = { email: '1', password: '1', encryptedClient: encrypt('cp') };

    await login(global.mockReq, global.mockRes, global.mockNext);
    ``
    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.objectContaining({
        isUserActive: false,
        isDocumentsFullfilled: true,
      }),
      global.mockNext,
    );
  });
});

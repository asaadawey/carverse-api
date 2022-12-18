import login from './login.controller';
import { DeepMockProxy } from 'jest-mock-extended';
import { sign } from 'jsonwebtoken';
import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import { HttpException } from 'errors';
import { createSuccessResponse, createFailResponse } from 'responses';
import { HTTPResponses } from 'interfaces/enums';

jest.mock('jsonwebtoken');

describe('users/login', () => {
  beforeEach(() => {
    //Mock sign
    (sign as DeepMockProxy<any>).mockReturnValue('Test');
  });

  it('Should return fail because password is incorrect', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({ Password: 'd' });

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      new HttpException(HTTPResponses.BusinessError, 'Email or password incorrect', 'password is incorrect'),
      global.mockNext,
    );
  });

  it('Should return fail because', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue();

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
    expect(createFailResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,

      new HttpException(HTTPResponses.BusinessError, 'Email or password incorrect', 'No user found'),
      global.mockNext,
    );
  });

  it('Should succeed', async () => {
    //@ts-ignore
    prismaMock.users.findFirst.mockResolvedValue({
      id: 1,
      Email: '1',
      Password: '1',
    });
    global.mockReq.body = { email: '1', password: '1' };

    await login(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      expect.anything(),
      global.mockNext,
    );
  });
});

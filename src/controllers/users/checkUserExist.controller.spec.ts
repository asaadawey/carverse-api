import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import checkUserExist from './checkUserExist.controller';
import { createSuccessResponse } from 'responses';

describe('users/checkUserExist', () => {
  it('Should return user not exist', async () => {
    prismaMock.users.findFirst.mockResolvedValue();
    await checkUserExist(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: false },
      global.mockNext,
    );
  });

  it('Should return user  exist', async () => {
    prismaMock.users.findFirst.mockResolvedValue({ id: 1 });
    await checkUserExist(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});

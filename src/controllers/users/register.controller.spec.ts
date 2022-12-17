import { prismaMock } from 'helpers/testHelpers/singeleton';
import register from './register.controller';
import { createSuccessResponse } from 'responses';

describe('users/register', () => {
  it('Should success', async () => {
    prismaMock.users.create.mockResolvedValue({});
    await register(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});

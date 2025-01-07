import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import register from './register.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('users/register', () => {
  it('Should success', async () => {
    prismaMock.users.create.mockResolvedValue({ id: 1 });
    global.mockReq = { ...global.mockReq, body: { UserTypeName: 'Test', Password: "Test" } };
    await register(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true, id: 1 },
      global.mockNext,
    );
  });
});

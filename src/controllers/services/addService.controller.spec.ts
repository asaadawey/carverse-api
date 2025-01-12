import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import addService from './addService.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('services/addService', () => {
  it('Should succeed and return all modules', async () => {
    prismaMock.services.create.mockReturnValue({
      id: 1,
    });
    await addService(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toBeCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true, createdItemId: 1 },
      global.mockNext,
    );
  });
});

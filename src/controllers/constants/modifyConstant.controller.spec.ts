import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import modifyConstant from './modifyConstant.controller';
import { createSuccessResponse } from 'src/responses';

describe('constants/modifyConstant', () => {
  it('Should success and modify constant', async () => {
    prismaMock.cars.findMany.mockResolvedValue([]);

    global.mockReq = { ...global.mockReq, params: { constantId: 1 }, body: { newValue: 10 } };

    await modifyConstant(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});

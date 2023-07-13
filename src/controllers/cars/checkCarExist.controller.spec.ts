import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import checkCarExist from './checkCarExist.controller';
import { createSuccessResponse } from 'src/responses';

describe('cars/checkCarExist', () => {
  it('Should return car not exist', async () => {
    prismaMock.cars.findMany.mockResolvedValue();
    await checkCarExist(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: false },
      global.mockNext,
    );
  });

  it('Should return car exist', async () => {
    prismaMock.cars.findMany.mockResolvedValue([{ i: 1 }]);
    await checkCarExist(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true },
      global.mockNext,
    );
  });
});

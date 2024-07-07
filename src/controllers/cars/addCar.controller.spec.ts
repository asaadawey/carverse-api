import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import addCar from './addCar.controller';
import { createSuccessResponse } from 'src/responses';

describe('cars/addCar', () => {
  it('Should succeed', async () => {
    prismaMock.cars.create.mockResolvedValue({ id: 1 });
    await addCar(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true, createdItemId: 1 },
      global.mockNext,
    );
  });
});

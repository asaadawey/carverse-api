import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllCars from './getAllCars.controller';
import { createSuccessResponse } from 'src/responses';

describe('cars/getAllCars', () => {
  it('Should success and return all cars', async () => {
    prismaMock.cars.findMany.mockResolvedValue([]);
    await getAllCars(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

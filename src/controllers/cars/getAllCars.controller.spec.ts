import { prismaMock } from 'helpers/testHelpers/singeleton';
import getAllCars from './getAllCars.controller';
import { createSuccessResponse } from 'responses';

describe('users/checkUserExist', () => {
  it('Should return user not exist', async () => {
    prismaMock.cars.findMany.mockResolvedValue([]);
    await getAllCars(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

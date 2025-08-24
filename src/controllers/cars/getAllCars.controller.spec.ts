import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllCars from './getAllCars.controller';
import { createSuccessResponse } from '@src/responses/index';
import { UserTypes } from '@src/interfaces/enums';

describe('cars/getAllCars', () => {
  it('Should success and return all cars', async () => {
    // Setup mock request with proper user and prisma
    global.mockReq.user = { id: 1, userType: UserTypes.Customer };
    global.mockReq.prisma = prismaMock;
    global.mockReq.query = {};

    prismaMock.cars.findMany.mockResolvedValue([]);

    await getAllCars(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

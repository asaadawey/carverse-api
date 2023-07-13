import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllBodyTypes from './getAllBodyTypes.controller';
import { createSuccessResponse } from 'src/responses';

describe('cars/getAllBodyTypes', () => {
  it('Should return user not exist', async () => {
    prismaMock.bodyTypes.findMany.mockResolvedValue([]);
    await getAllBodyTypes(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

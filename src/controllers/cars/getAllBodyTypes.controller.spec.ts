import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllBodyTypes from './getAllBodyTypes.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('cars/getAllBodyTypes', () => {
  it('Should return body types', async () => {
    prismaMock.bodyTypes.findMany.mockResolvedValue([]);
    await getAllBodyTypes(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

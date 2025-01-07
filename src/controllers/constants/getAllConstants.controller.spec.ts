import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getAllConstants from './getAllConstants.controller';
import { createSuccessResponse } from '@src/responses/index';

describe('constants/getAllConstants', () => {
  it('Should succeed and return all constants', async () => {
    prismaMock.constants.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllConstants(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [
        {
          test: 'test',
        },
      ],
      global.mockNext,
    );
  });
});

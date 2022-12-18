import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import getAllModules from './getAllModules.controller';
import { createSuccessResponse } from 'responses';

describe('modules/getAllModules', () => {
  it('Should succeed and return all modules', async () => {
    prismaMock.modules.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllModules(global.mockReq, global.mockRes, global.mockNext);

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

import { prismaMock } from 'helpers/testHelpers/unit-singeleton';
import getAllPackages from './getAllPackages.controller';
import { createSuccessResponse } from 'responses';

describe('packages/getAllPackages', () => {
  it('Should succeed and return all packages', async () => {
    prismaMock.packages.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllPackages(global.mockReq, global.mockRes, global.mockNext);

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

  it('Should succeed and empty packages', async () => {
    prismaMock.packages.findMany.mockResolvedValue();
    await getAllPackages(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(global.mockReq, global.mockRes, [], global.mockNext);
  });
});

import { prismaMock } from 'src/helpers/testHelpers/unit-singeleton';
import getAllProviderServices from './getAllProviderServices.controller';
import { createFailResponse, createSuccessResponse } from 'src/responses';

describe('services/getAllProviderServices', () => {
  it('Should succeed and return all modules', async () => {
    global.mockReq = {
      ...global.mockReq,
      user: {
        userType: "Provider",
        providerId: "1"
      },
      params: {
        providerId: "1",
      }
    }
    prismaMock.providerServices.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllProviderServices(global.mockReq, global.mockRes, global.mockNext);

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

  it('Should fail because providerId dont belongs to the current user', async () => {
    global.mockReq = {
      ...global.mockReq,
      user: {
        userType: "Provider",
        providerId: "1" // Different than the one provided in the params
      },
      params: {
        providerId: "2",
      }
    }
    prismaMock.providerServices.findMany.mockResolvedValue([
      {
        test: 'test',
      },
    ]);
    await getAllProviderServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createFailResponse).toHaveBeenCalledTimes(1);
  });
});

import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import { createSuccessResponse } from '@src/responses/index';
import getAllServices from './getAllServices.controller';

describe('services/getAllServices', () => {
  it('Should succeed and return all modules', async () => {
    // Setup required request data
    global.mockReq.params = { moduleId: '1' };
    global.mockReq.query = {};

    const mockService = {
      id: 1,
      ServiceName: 'Car Wash',
      ServiceDescription: 'Basic car wash service',
      isAvailableForAutoSelect: true,
    };

    const mockPriceStats = {
      _min: { Price: 10.0 },
      _max: { Price: 50.0 },
      _avg: { Price: 30.0 },
    };

    prismaMock.services.findMany.mockResolvedValue([mockService]);
    prismaMock.providerServicesAllowedBodyTypes.aggregate.mockResolvedValue(mockPriceStats);

    await getAllServices(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      [
        {
          ...mockService,
          priceStats: {
            min: 10,
            max: 50,
            avg: 30,
          },
        },
      ],
      global.mockNext,
    );
  });
});

import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import confirmOrder from './confirmOrder.controller';
import createSuccessResponse from '@src/responses/success';

describe('users/confirmOrder', () => {
  it('Should return addresses', async () => {
    // Setup required mock data
    global.mockReq.params = { orderId: '1' };
    global.mockReq.body = {
      rating: 5,
      isOrderCompleted: true,
      notes: 'Great service!',
      feedback: 'Very satisfied',
    };
    global.mockReq.user = { id: 1 };

    // Mock the order lookup
    prismaMock.orders.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.orderRating.create.mockResolvedValue({ id: 1 });

    await confirmOrder(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(
      global.mockReq,
      global.mockRes,
      { result: true, createdItemId: 1 },
      global.mockNext,
    );
  });
});

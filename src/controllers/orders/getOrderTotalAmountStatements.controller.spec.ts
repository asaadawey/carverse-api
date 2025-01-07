import { prismaMock } from '@src/helpers/testHelpers/unit-singeleton';
import getOrderTotalAmountStatements from './getOrderTotalAmountStatements.controller';
import { createSuccessResponse } from '@src/responses/index';
import { Constants } from '@src/interfaces/enums';
import { ConstantType } from '@prisma/client';
import { decrypt } from '@src/utils/encrypt';
import { Decimal } from '@prisma/client/runtime/library';

describe('orders/getOrderTotalAmount', () => {
  it('Should success and return the order', async () => {
    const providerServiceFees = new Decimal(40);
    const vatPerc = new Decimal(10.9);
    const serviceCharges = 10;
    const vat = providerServiceFees.mul(vatPerc.div(100));
    prismaMock.providerServicesAllowedBodyTypes.findMany.mockResolvedValue([
      {
        id: 1,
        Price: providerServiceFees,
        providerService: {
          services: {
            ServiceName: 'Service fee',
          },
        }
      },
    ]);

    prismaMock.constants.findMany.mockResolvedValue([
      {
        id: 1,
        Name: Constants.VAT,
        Value: vatPerc,
        Type: ConstantType.Percentage,
      },
      {
        id: 2,
        Name: Constants.ServiceCharges,
        Value: serviceCharges,
        Type: ConstantType.Amount,
      },
    ]);
    global.mockReq.query = { paymentMethodName: 'Cash', providerServiceBodyTypesIds: '1,2' };
    await getOrderTotalAmountStatements(global.mockReq, global.mockRes, global.mockNext);

    expect(createSuccessResponse).toHaveBeenCalledTimes(1);

    //@ts-ignore
    const returnResult = createSuccessResponse.mock.calls[0][2];

    expect(returnResult.statements[0].name).toBe('Service fee');
    expect(decrypt(returnResult.totalAmount)).toBe('' + vat.plus(serviceCharges).plus(providerServiceFees));
    expect(decrypt(returnResult.statements[0].encryptedValue)).toBe('' + providerServiceFees);
    expect(decrypt(returnResult.statements[1].encryptedValue)).toBe('' + vat);
    expect(decrypt(returnResult.statements[2].encryptedValue)).toBe('' + serviceCharges);
  });
});

import { ConstantType } from '@prisma/client';
import { getAmount } from './amountUtils';
import { Decimal } from '@prisma/client/runtime/library';

describe('amountUtils.ts', () => {
  it('should return amount', () => {
    const value = 100;

    const result = getAmount(new Decimal(value), ConstantType.Amount, new Decimal(200));

    expect(result).toBe(100);
  });
  it('should return percentage', () => {
    const value = new Decimal(5);
    const currentAmount = 100;

    const result = getAmount(new Decimal(value), ConstantType.Percentage, new Decimal(currentAmount));

    expect(result).toBe(value.div(100).mul(currentAmount).toNumber());
  });
});

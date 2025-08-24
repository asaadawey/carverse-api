import { ConstantType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { decrypt, encrypt } from './encrypt';

export const getAmount = (value: Decimal, type: ConstantType, currentTotalAmount?: Decimal): number => {
  let returnValue;

  switch (type) {
    case ConstantType.Numeric:
    case ConstantType.Amount:
      returnValue = value.toNumber();
      break;
    case ConstantType.Percentage:
      returnValue = currentTotalAmount?.mul?.(value.div(100)).toNumber() || 0;
      break;
  }

  return returnValue;
};

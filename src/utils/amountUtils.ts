import { ConstantType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export const getAmount = (value: Decimal, type: ConstantType, currentTotalAmount?: Decimal): Decimal => {
  switch (type) {
    case ConstantType.Numeric:
    case ConstantType.Amount:
      return value;
    case ConstantType.Percentage:
      return currentTotalAmount?.mul?.(value.div(100)) || new Decimal(0);
  }
};

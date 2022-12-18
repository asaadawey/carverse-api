import prisma from './client';
import seed from './seed';

describe('Seed tests', () => {
  it('Should seed to database', async () => {
    await seed();

    // Test payment method
    const paymentMethod = await prisma.paymentMethods.findUnique({
      where: {
        MethodName: 'Cash',
      },
      select: { id: true },
    });

    expect(paymentMethod?.id).toBeGreaterThan(0);
  });
});

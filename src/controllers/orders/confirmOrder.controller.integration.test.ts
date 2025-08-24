import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import { HTTPResponses } from '@src/interfaces/enums';
import randomstring from 'randomstring';

describe('Integration user/getPreviousAddresses', () => {
  let customerUserId;
  let customerId;
  let orderId;
  beforeAll(async () => {
    await prisma.orders.deleteMany();
    const userId = await prisma.users.create({
      data: {
        Email: randomstring.generate(7),
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation2on',
        Password: randomstring.generate(7),
        PhoneNumber: randomstring.generate(7),
        isActive: true,
        customer: {
          create: {},
        },
        userTypes: { create: { TypeName: randomstring.generate(7), AllowedClients: ['cp'] } },
      },
      select: {
        id: true,
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    customerUserId = userId.id;
    customerId = userId.customer?.id;

    const order = await prisma.orders.create({
      data: {
        ProviderNetProfit: 123,
        paymentMethods: {
          connectOrCreate: {
            create: { MethodName: 'Cash', MethodDescription: 's' },
            where: { MethodName: 'Cash' }, // Seed value
          },
        },
        AddressString: 'Test',
        Latitude: 1234,
        Longitude: 4321,
        OrderTotalAmount: 1,
        customer: {
          connect: {
            id: customerId,
          },
        },
        provider: {
          create: {
            CompanyName: randomstring.generate(7),
            users: {
              create: {
                Email: randomstring.generate(7),
                FirstName: 'testFirst',
                LastName: 'testLast',
                Nationality: 'testNation',
                Password: 'testPaswword',
                PhoneNumber: randomstring.generate(7),
                userTypes: { create: { TypeName: randomstring.generate(7) } },
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    orderId = order.id;
  });

  it('Should update rating', async () => {
    const result = await supertest(app)
      .post(apiPrefix + `${RouterLinks.confirmOrder.replace(':orderId', orderId)}`)
      .set(commonHeaders(customerUserId))
      .send({ rating: 5, feedback: 'bad' })
      .expect(HTTPResponses.Success);

    expect(result.body.data.result).toBe(true);

    const rating = await prisma.orderRating.findFirst();

    expect(rating?.OrderID).toBe(orderId);
    expect(rating?.Feedback).toBe('bad');
  });
});

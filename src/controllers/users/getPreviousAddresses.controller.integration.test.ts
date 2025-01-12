import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import { HTTPResponses, UserTypes } from '@src/interfaces/enums';
import randomstring from 'randomstring';

describe('Integration user/getPreviousAddresses', () => {
  let customerUserId;
  let customerId;
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

    await prisma.orders.create({
      data: {
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
    await prisma.orders.create({
      data: {
        paymentMethods: {
          connectOrCreate: {
            create: { MethodName: 'Cash', MethodDescription: 's' },
            where: { MethodName: 'Cash' }, // Seed value
          },
        },
        AddressString: 'Test2',
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
  });

  it('Should get two addressess', async () => {
    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getPreviousAddresses}`)
      .set(commonHeaders(customerUserId))
      .send()
      .expect(HTTPResponses.Success);

    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(2);
  });

  it('Should get one address', async () => {
    await prisma.orders.updateMany({ data: { AddressString: 'Test' } });

    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getPreviousAddresses}`)
      .set(commonHeaders(customerUserId))
      .send()
      .expect(HTTPResponses.Success);

    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
  });
});

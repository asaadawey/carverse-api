import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration providers/getOneProvider', () => {
  let createdUserId: number;
  let createdNoOrdersUserId: number;
  let createdProviderId: number;
  beforeAll(async () => {
    const createdUser = await prisma.users.create({
      data: {
        Email: randomstring.generate(7),
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: randomstring.generate(7),
        userTypes: {
          connectOrCreate: { where: { TypeName: 'Test' }, create: { TypeName: randomstring.generate(7) } },
        },
        provider: {
          create: {
            orders: {
              create: {
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
            },
          },
        },
      },
      select: {
        id: true,
        provider: { select: { id: true } },
      },
    });
    const noOrdersProvider = await prisma.users.create({
      data: {
        Email: randomstring.generate(7),
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: randomstring.generate(7),
        userTypes: {
          connectOrCreate: { where: { TypeName: 'Test' }, create: { TypeName: randomstring.generate(7) } },
        },
        provider: { create: {} },
      },
      select: {
        id: true,
        provider: { select: { id: true } },
      },
    });
    createdUserId = createdUser.id;
    createdNoOrdersUserId = noOrdersProvider.id;
    createdProviderId = createdUser.provider?.id || 0;
  });

  it('Should return one provider with user id', async () => {
    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getOneProvider.replace(':id', String(createdUserId))}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(result.body.data).toBeTruthy();
    expect(result.body.data.id).toBe(createdProviderId);
  });

  it('Should return one provider with provider id', async () => {
    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getOneProvider.replace(':id', String(createdProviderId))}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(result.body.data).toBeTruthy();
    expect(result.body.data.id).toBe(createdProviderId);
  });

  it('Should return empty if no provider found', async () => {
    const randomId = 11111111;
    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getOneProvider.replace(':id', String(randomId))}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Object.keys(result.body.data).length).toBe(0);
  });

  it('Should return zero orders', async () => {
    const result = await supertest(app)
      .get(apiPrefix + `${RouterLinks.getOneProvider.replace(':id', String(createdNoOrdersUserId))}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(result.body.data.ordersCount).toBe(0);
  });
});

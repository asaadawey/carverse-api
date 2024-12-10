import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration orders/getOneOrder', () => {
  it('Should return one order', async () => {
    const createResult = await prisma.orders.create({
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
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getOneOrder.replace('/:id', '')}/${createResult.id}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(result.body.data).toBeTruthy();
    expect(result.body.data.Longitude).toBe(4321);
  });

  it('Should success but no order found', async () => {
    const randomId = 11111111;
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getOneOrder.replace(':id', String(randomId))}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Object.keys(result.body.data || {}).length).toBe(0);
  });
});

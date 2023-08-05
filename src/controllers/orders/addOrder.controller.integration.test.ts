import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';

describe('Integration orders/addOrder', () => {
  let customerId: number;
  let providerId: number;
  let createdCarId: number;
  let createdServiceId: number;
  beforeAll(async () => {
    const createdUser = await prisma.$transaction([
      prisma.users.create({
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
          cars: {
            create: {
              Color: 'Red',
              Manufacturer: 'Mercedes',
              Model: '2010',
              PlateNumber: '58849',
              bodyTypes: { create: { TypeName: randomstring.generate(7) } },
            },
          },
          customer: { create: {} },
        },
        select: {
          id: true,
          customer: { select: { id: true } },
          cars: { select: { id: true } },
        },
      }),
      prisma.users.create({
        data: {
          Email: randomstring.generate(7),
          FirstName: 'testFirst',
          LastName: 'testLast',
          Nationality: 'testNation',
          Password: 'testPaswword',
          PhoneNumber: randomstring.generate(7),
          userTypes: { create: { TypeName: randomstring.generate(7) } },
          provider: { create: {} },
        },
        select: {
          id: true,
          provider: { select: { id: true } },
        },
      }),
      prisma.paymentMethods.upsert({
        create: { MethodName: 'Cash', MethodDescription: 's' },
        update: {},
        where: { MethodName: 'Cash' },
      }),
      prisma.orderHistoryItems.upsert({
        create: { HistoryName: 'Pending' },
        update: {},
        where: { HistoryName: 'Pending' },
      }),
    ]);
    customerId = createdUser[0].customer?.id || 0;
    providerId = createdUser[1].provider?.id || 0;
    const createService = await prisma.providerServices.create({
      data: {
        provider: { connect: { id: providerId } },
        services: {
          create: {
            ServiceDescription: 'Test',
            ServiceIconLink: '/',
            ServiceName: 'Test',
            colorGradiants: {
              create: {
                ColorEnd: 'r',
                ColorName: randomstring.generate(7),
                ColorMainText: randomstring.generate(7),
                ColorSecondaryText: 'e',
                ColorStart: 'T',
              },
            },
            modules: {
              create: {
                ModuleName: randomstring.generate(7),
                ModuleDescription: 'f',
                ModuleIconLink: 'd',
              },
            },
          },
        },
      },

      select: {
        id: true,
      },
    });

    createdCarId = createdUser[0].cars[0].id;
    createdServiceId = createService.id;
  });
  it('Should success', async () => {
    console.log({
      carId: createdCarId,
      serviceId: createdServiceId,
    });
    const result = await supertest(app)
      .post(RouterLinks.addOrder)
      .set(commonHeaders())
      .send({
        providerId,
        customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceId: createdServiceId,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
      })
      .expect(HTTPResponses.Success);

    const createdOrder = await prisma.orders.findFirst({
      where: {
        AND: [{ AddressString: { equals: 'Bateen' } }, { OrderTotalAmount: { equals: 400 } }],
      },
      select: { id: true },
    });

    expect(result.body.id).toBe(createdOrder?.id);
  });

  it('Should be false because schema is incorrect', async () => {
    const result = await supertest(app)
      .post(RouterLinks.addOrder)
      .set(commonHeaders())
      .send({
        providerId,
        customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceId: createdServiceId,
          },
        ],
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
      })
      .expect(HTTPResponses.ValidationError);

    expect(result.body.message).toBe(HTTPErrorString.BadRequest);
  });
});

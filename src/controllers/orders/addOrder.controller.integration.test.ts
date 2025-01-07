import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
// import { ConstantType } from '@prisma/client';
import { Statements } from './getOrderTotalAmountStatements.controller';
import { encrypt } from '@src/utils/encrypt';

describe('Integration orders/addOrder', () => {
  let customerId: number;
  let providerId: number;
  let createdCarId: number;
  let createdServiceId: number;
  // let createdConstantId: number;
  // const vatPerc = 5;
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
              bodyTypes: { connectOrCreate: { create: { TypeName: "Sedan" }, where: { TypeName: "Sedan" } } },
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
    const createService = await prisma.providerServicesAllowedBodyTypes.create({
      data: {
        Price: 40,
        bodyType: {
          connectOrCreate: {
            create: { TypeName: "Sedan" },
            where: { TypeName: "Sedan" }
          }
        },
        providerService: {
          create: {

          }
        }
      },

      select: {
        id: true,
      },
    });

    createdCarId = createdUser[0].cars[0].id;
    createdServiceId = createService.id;

    // const constant = await prisma.constants.create({
    //   data: {
    //     Name: randomstring.generate(7),
    //     Type: ConstantType.Percentage,
    //     Value: vatPerc,
    //   },
    //   select: {
    //     id: true,
    //   },
    // });

    // createdConstantId = constant.id;
  });

  it('Should success', async () => {
    await prisma.orders.deleteMany();
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.addOrder)
      .set(commonHeaders(1, false, { extrauser: { customerId } }))
      .send({
        providerId,
        // customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceBodyTypeId: createdServiceId,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        paymentMethodName: 'Cash',
        orderTotalAmountStatement: [
          {
            name: 'service fees',
            encryptedValue: encrypt(String(400)),
            relatedProviderServiceId: createdServiceId,
          },
        ] as Statements[],
      })
      .expect(HTTPResponses.Success);

    const createdOrder = await prisma.orders.findFirst({
      where: {
        AND: [{ AddressString: { equals: 'Bateen' } }, { OrderTotalAmount: { equals: 400 } }],
      },
      select: { id: true },
    });

    expect(result.body.data.id).toBe(createdOrder?.id);
  });

  it("Should fail because the total amount sent is incorrect and doesn't match", async () => {
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.addOrder)
      .set(commonHeaders())
      .send({
        providerId,
        // customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceBodyTypeId: createdServiceId,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        paymentMethodName: 'Cash',
        orderTotalAmountStatement: [
          {
            name: 'service fees',
            encryptedValue: encrypt(String(60000000000000)),
            relatedProviderServiceId: createdServiceId,
          },
        ] as Statements[],
      })
      .expect(HTTPResponses.BusinessError);

    expect(result.body.message).toBe(HTTPErrorString.SomethingWentWrong);
  });

  it('Should be false because schema is incorrect', async () => {
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.addOrder)
      .set(commonHeaders())
      .send({
        providerId,
        // customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceBodyTypeId: createdServiceId,
          },
        ],
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
      })
      .expect(HTTPResponses.ValidationError);

    expect(result.body.message).toBe(HTTPErrorString.BadRequest);
  });

  it('Should be false because method name is not active', async () => {
    await prisma.paymentMethods.update({ where: { MethodName: "Cash" }, data: { isActive: false } });
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.addOrder)
      .set(commonHeaders())
      .send({
        providerId,
        // customerId,
        orderServices: [
          {
            carId: createdCarId,
            providerServiceBodyTypeId: createdServiceId,
          },
        ],
        orderAmount: 400,
        longitude: 12,
        latitude: 13,
        addressString: 'Bateen',
        paymentMethodName: 'Cash',
        orderTotalAmountStatement: [
          {
            name: 'service fees',
            encryptedValue: encrypt(String(400)),
            relatedProviderServiceId: createdServiceId,
          },
        ] as Statements[],
      })
      .expect(HTTPResponses.BusinessError);

    expect(result.body.message).toBe(HTTPErrorString.SomethingWentWrong);
  });
});

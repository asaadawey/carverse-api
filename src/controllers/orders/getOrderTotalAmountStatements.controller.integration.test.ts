import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { Constants, HTTPResponses } from '@src/interfaces/enums';
import { Decimal } from '@prisma/client/runtime/library';
import { decrypt } from '@src/utils/encrypt';
import { ConstantType } from '@prisma/client';

describe('Integration orders/getOrderTotalAmountStatements', () => {
  let createdProviderServiceId: number;
  let createdVatConstantId: number;
  let serviceFees = 6;
  const vatPerc = 5;
  const providerServicePrice = 45.3;
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
    const createService = await prisma.providerServices.create({
      data: {
        providerServicesAllowedBodyTypes: {
          create: {
            Price: providerServicePrice,
            bodyType: {
              connectOrCreate: {
                create: {
                  TypeName: 'Sedan',
                },
                where: {
                  TypeName: 'Sedan',
                },
              },
            },
          },
        },
        provider: { connect: { id: createdUser[0].provider?.id || 0 } },
        services: {
          create: {
            ServiceDescription: 'Test',
            ServiceIconLink: '/',
            ServiceName: randomstring.generate(7),
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
        providerServicesAllowedBodyTypes: {
          select: {
            id: true,
          },
        },
      },
    });

    createdProviderServiceId = createService.providerServicesAllowedBodyTypes[0].id;
    await prisma.constants.deleteMany();
    // Since VAT and service fees inside the seed. the no need to create
    const vatConstant = await prisma.constants.create({
      data: {
        Name: Constants.VAT,
        Label: 'VAT 5',
        Type: ConstantType.Percentage,
        Value: new Decimal(vatPerc),
      },
      select: {
        id: true,
        Value: true,
      },
    });

    await prisma.constants.create({
      data: {
        Name: Constants.ServiceCharges,
        Type: ConstantType.Amount,
        Label: 'Service',
        Value: new Decimal(serviceFees),
      },
      select: {
        Value: true,
      },
    });
    createdVatConstantId = vatConstant?.id || 0;
  });

  it('Should success and return right statements', async () => {
    const vat = providerServicePrice * ((vatPerc as number) / 100);
    const result = await supertest(app)
      .get(
        apiPrefix +
          `${RouterLinks.getOrderTotalAmountStatements}?paymentMethodName=Cash&providerServiceBodyTypesIds=${createdProviderServiceId}`,
      )
      .set(commonHeaders())
      .send({})
      .expect(HTTPResponses.Success);

    expect(Array.isArray(result.body.data.statements)).toBe(true);
    expect(result.body.data.statements[1].relatedConstantId).toBe(createdVatConstantId);
    expect(new Decimal(decrypt(result.body.data.totalAmount))).toEqual(
      new Decimal(vat).add(new Decimal(providerServicePrice)).add(new Decimal(serviceFees)),
    );
  });
});

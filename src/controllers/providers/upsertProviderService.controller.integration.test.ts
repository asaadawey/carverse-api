import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration providers/upsertProviderServices', () => {
  let providerUserId: number;
  let providerId: number;
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
    providerId = createdUser[0].provider?.id || 0;
    providerUserId = createdUser[0].id;
    const createService = await prisma.services.create({
      data: {
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

      select: {
        id: true,
        modules: {
          select: {
            id: true,
          },
        },
      },
    });
    createdServiceId = createService.id;
  });
  it('Should success and create a new provider service', async () => {
    const result = await supertest(app)
      .post(RouterLinks.addProviderService)
      .set(commonHeaders(providerUserId, false, { extrauser: { providerId: providerId } }))
      .send({
        serviceId: createdServiceId,
        servicePrice: 40,
      })
      .expect(HTTPResponses.Success);

    const createdProviderService = await prisma.providerServices.findFirst({
      where: {
        AND: [{ ProviderID: { equals: providerId } }, { services: { id: { equals: createdServiceId } } }],
      },
      select: { id: true, ServiceID: true },
    });

    expect(createdProviderService?.id).toBe(result.body.createdItemId);
  });

  it('Should success and update existing provider service', async () => {
    const providerService = await prisma.providerServices.create({
      data: {
        ProviderID: providerId,
        ServiceID: createdServiceId,
        Price: 10,
      },
      select: {
        id: true,
      }
    })
    await supertest(app)
      .post(RouterLinks.addProviderService)
      .set(commonHeaders(providerUserId))
      .send({
        providerServiceId: providerService.id,
        servicePrice: 40,
      })
      .expect(HTTPResponses.Success);

    const createdProviderService = await prisma.providerServices.findFirst({
      where: {
        id: providerService.id,
      },
      select: { id: true, Price: true },
    });

    expect(Number(createdProviderService?.Price)).toBe(40);
  });

  it('Should success and make existing one inactive', async () => {
    const providerService = await prisma.providerServices.create({
      data: {
        ProviderID: providerId,
        ServiceID: createdServiceId,
        Price: 10,
      },
      select: {
        id: true,
      }
    })
    await supertest(app)
      .post(RouterLinks.addProviderService)
      .set(commonHeaders(providerUserId))
      .send({
        providerServiceId: providerService.id,
        isDelete: true,
      })
      .expect(HTTPResponses.Success);

    const createdProviderService = await prisma.providerServices.findFirst({
      where: {
        id: providerService.id,
      },
      select: { id: true, isActive: true },
    });

    expect(createdProviderService?.isActive).toBe(false);
  });

});

import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration providers/addProviderServices', () => {
  let providerUserId: number;
  let providerId: number;
  let createdModuleId: number;
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
    createdModuleId = createService.modules.id;
    createdServiceId = createService.id;
  });
  it('Should success when passing existing service id', async () => {
    await supertest(app)
      .post(RouterLinks.addProviderService.replace(':moduleId', '' + createdModuleId))
      .set(commonHeaders(providerUserId))
      .send({
        serviceId: createdServiceId,
        servicePrice: 40,
      })
      .expect(HTTPResponses.Success);

    const createdProviderService = await prisma.providerServices.findFirst({
      where: {
        AND: [{ ProviderID: { equals: providerId } }, { services: { ModuleID: { equals: createdModuleId } } }],
      },
      select: { id: true, ServiceID: true },
    });

    expect(createdProviderService?.ServiceID).toBe(createdServiceId);
  });

  it('Should success when passing new service details', async () => {
    const name = randomstring.generate(7);
    await supertest(app)
      .post(RouterLinks.addProviderService.replace(':moduleId', '' + createdModuleId))
      .set(commonHeaders(providerUserId))
      .send({
        servicePrice: 40,
        serviceName: name,
        serviceDescription: 'Mangoa',
      })
      .expect(HTTPResponses.Success);

    const createdProviderService = await prisma.providerServices.findFirst({
      where: {
        AND: [
          { ProviderID: { equals: providerId } },
          { services: { ModuleID: { equals: createdModuleId } } },
          { services: { ServiceName: { equals: name } } },
        ],
      },
      select: { id: true, ServiceID: true },
    });

    expect(createdProviderService?.ServiceID).not.toBe(createdServiceId);
  });
});

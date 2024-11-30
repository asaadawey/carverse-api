import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration services/getAllServices', () => {
  let createdModuleId: number;

  beforeAll(async () => {
    await prisma.provider.deleteMany();
    const createdModule = await prisma.modules.upsert({
      create: {
        ModuleName: 'Car washing',
        ModuleIconLink: '/icons/car-wash.png',
        ModuleDescription: 'Wash your car easily by dispatching our providers',
      },
      update: {},
      where: { ModuleName: 'Car washing' },
      select: {
        id: true,
      },
    });
    await prisma.services.create({
      data: {
        modules: {
          connect: {
            id: createdModule.id,
          },
        },
        ServiceIconLink: 'test',
        ServiceName: 'testName',
        ServiceDescription: 'test',

        colorGradiants: {
          connectOrCreate: {
            where: { ColorName: 'Orange' },
            create: {
              ColorName: 'Gold',
              ColorMainText: 'white',
              ColorSecondaryText: 'white',
              ColorEnd: '#ffac33',
              ColorStart: '#b26a00',
            },
          },
        },
      },
    });

    createdModuleId = createdModule.id;
    // createdServiceId = createdService.id;
  });

  it('Should success and return services', async () => {
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.getAllServices.replace(':moduleId', String(createdModuleId)))
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
    expect(result.body.data[0].ServiceName).toBe('testName');
  });

  it('Should return empty array becuase module id is incorrect', async () => {
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.getAllServices.replace(':moduleId', String(createdModuleId + 123)))
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(0);
  });
});

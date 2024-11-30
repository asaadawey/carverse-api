import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration providers/addService', () => {
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

    createdModuleId = createdModule.id;
  });

  it('Should success and return services', async () => {
    const result = await supertest(app)
      .post(apiPrefix +
        RouterLinks.addServices
      )
      .set(commonHeaders())
      .send({
        moduleId: createdModuleId,
        serviceDescription: "Test",
        serviceName: "test"
      })
      .expect(HTTPResponses.Success);
    expect(result.body.data.createdItemId).toBeDefined();
    expect(result.body.data.result).toBe(true);
  });
});

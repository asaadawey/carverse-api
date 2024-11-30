import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration providers/getAllProviderServices', () => {
  let createdProviderId: number;
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
    const createdProvider = await prisma.provider.create({
      data: {
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
        NumberOfOrders: 231,
        providerServices: {
          create: [
            {
              services: {
                create: {
                  ServiceName: "test",
                  ServiceDescription: "rt",
                  ServiceIconLink: "tr",
                  modules: {
                    connect: {
                      id: createdModuleId
                    }
                  }
                }
              },
              Pofeciency: 'Expert',
              providerServicesAllowedBodyTypes: {
                create: {
                  Price: 30,
                  bodyType: {
                    connectOrCreate: {
                      create: {
                        TypeName: "Sedan"
                      },
                      where: {
                        TypeName: "Sedan"
                      }
                    }
                  }
                }
              },
            }
          ],
        },
      },
      select: {
        id: true,
      },
    });


    createdProviderId = createdProvider.id;
  });

  it('Should success and return services', async () => {
    const result = await supertest(app)
      .get(
        RouterLinks.getAllProviderServices
          .replace(':moduleId', String(createdModuleId))
          .replace(':providerId', String(createdProviderId)),
      )
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
    expect(result.body.data[0].Pofeciency).toBe('Expert');
  });

  it('Should return empty array becuase provider id is incorrect', async () => {
    const result = await supertest(app)
      .get(
        RouterLinks.getAllProviderServices
          .replace(':moduleId', String(createdModuleId))
          .replace(':providerId', String(createdModuleId + 1234)),
      )
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(0);
  });

  it('Should return unauthorised if the access person is incorrect', async () => {
    await supertest(app)
      .get(
        RouterLinks.getAllProviderServices
          .replace(':moduleId', String(createdModuleId))
          .replace(":providerId", "2")
      )
      .set(commonHeaders(1, false, { extrauser: { userType: "Provider" } }))
      .send()
      .expect(HTTPResponses.Unauthorised);
  });
});

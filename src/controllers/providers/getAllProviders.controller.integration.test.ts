import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

describe('Integration providers/getAllProviders', () => {
  let createdProvider: any;
  beforeAll(async () => {
    await prisma.provider.deleteMany();
    await prisma.provider.create({
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
              Price: 30,
              services: {
                connectOrCreate: {
                  create: {
                    ServiceName: 'Stem wash',
                    ServiceDescription: '1',
                    ServiceIconLink: '1',
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
                    modules: {
                      connectOrCreate: {
                        create: {
                          ModuleName: 'Car washing',
                          ModuleIconLink: '/icons/car-wash.png',
                          ModuleDescription: 'Wash your car easily by dispatching our providers',
                        },
                        where: { ModuleName: 'Car washing' },
                      },
                    },
                  },
                  where: { ServiceName: 'Stem wash' },
                },
              },
            },
            {
              Price: 15,
              services: {
                connectOrCreate: {
                  create: {
                    ServiceName: 'Stem wash',
                    ServiceDescription: '1',
                    ServiceIconLink: '1',
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
                    modules: {
                      connectOrCreate: {
                        create: {
                          ModuleName: 'Car washing',
                          ModuleIconLink: '/icons/car-wash.png',
                          ModuleDescription: 'Wash your car easily by dispatching our providers',
                        },
                        where: { ModuleName: 'Car washing' },
                      },
                    },
                  },
                  where: { ServiceName: 'Stem wash' },
                },
              },
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });
    createdProvider = await prisma.provider.create({
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
              Price: 30,
              services: {
                connectOrCreate: {
                  create: {
                    ServiceName: 'Stem wash',
                    ServiceDescription: '1',
                    ServiceIconLink: '1',
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
                    modules: {
                      connectOrCreate: {
                        create: {
                          ModuleName: 'Car washing',
                          ModuleIconLink: '/icons/car-wash.png',
                          ModuleDescription: 'Wash your car easily by dispatching our providers',
                        },
                        where: { ModuleName: 'Car washing' },
                      },
                    },
                  },
                  where: { ServiceName: 'Stem wash' },
                },
              },
            },
            {
              Price: 15,
              services: {
                connectOrCreate: {
                  create: {
                    ServiceName: 'Stem wash',
                    ServiceDescription: '1',
                    ServiceIconLink: '1',
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
                    modules: {
                      connectOrCreate: {
                        create: {
                          ModuleName: 'Car washing',
                          ModuleIconLink: '/icons/car-wash.png',
                          ModuleDescription: 'Wash your car easily by dispatching our providers',
                        },
                        where: { ModuleName: 'Car washing' },
                      },
                    },
                  },
                  where: { ServiceName: 'Stem wash' },
                },
              },
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });
  });

  it('Should success with no average', async () => {
    const result = await supertest(app)
      .get(RouterLinks.getAllProviders)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(2);
    expect(result.body[0].NumberOfOrders).toBe(231);
  });

  it('Should success with no average and only return providers with givin ids', async () => {
    const result = await supertest(app)
      .get(`${RouterLinks.getAllProviders}?ids=${createdProvider.id}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].id).toBe(createdProvider.id);
  });

  it('Should success with average', async () => {
    const result = await supertest(app)
      .get(`${RouterLinks.getAllProviders}?avg=true`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(2);
    expect(result.body[0].avg).toBe((15 + 30) / 2);
  });

  it('Should success and return 0 length because take pagination is zero', async () => {
    const result = await supertest(app)
      .get(`${RouterLinks.getAllProviders}?take=0`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(0);
  });

  it('Should fail because wrong value passed to average', async () => {
    const result = await supertest(app)
      .get(`${RouterLinks.getAllProviders}?avg=wrong`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.ValidationError);
    expect(result.body.message).toBe(HTTPErrorString.BadRequest);
  });
});

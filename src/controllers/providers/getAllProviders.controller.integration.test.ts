import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';

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
            },
            {
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
        UserID: true,
      },
    });
  });

  it('Should success with no average', async () => {
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getAllProviders}?ids=${createdProvider.UserID}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
    expect(result.body.data[0].NumberOfOrders).toBe(231);
  });

  it('Should success with no average and only return providers with givin ids', async () => {
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getAllProviders}?ids=${createdProvider.UserID}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
    expect(result.body.data[0].id).toBe(createdProvider.id);
  });

  // it('Should success with average', async () => {
  //   const result = await supertest(await app())
  //     .get(`${RouterLinks.getAllProviders}?avg=true&ids=${createdProvider.UserID}`)
  //     .set(commonHeaders())
  //     .send()
  //     .expect(HTTPResponses.Success);
  //   expect(Array.isArray(result.body.data)).toBe(true);
  //   expect(result.body.data.length).toBe(1);
  //   expect(result.body.data[0].avg).toBe((15 + 30) / 2);
  // });

  it('Should success and return 0 length because take pagination is zero', async () => {
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getAllProviders}?take=0&ids=${createdProvider.UserID}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(0);
  });

  it('Should fail because wrong value passed to average', async () => {
    const result = await supertest(await app())
      .get(apiPrefix + `${RouterLinks.getAllProviders}?avg=wrong&ids=${createdProvider.UserID}`)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.ValidationError);
    expect(result.body.message).toBe(HTTPErrorString.BadRequest);
  });
});

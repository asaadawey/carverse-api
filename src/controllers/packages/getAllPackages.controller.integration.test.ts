import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'interfaces/enums';

describe('Integration packages/getAllPackages', () => {
  it('Should success', async () => {
    const createdPackage = await prisma.packages.create({
      data: {
        PackageDescription: '1',
        PackageIconLink: '/',
        PackageName: randomstring.generate(7),
        PackageOriginalPrice: 1,
        PackagePrice: 1,
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
    });
    const carWash = await prisma.modules.findUnique({ where: { ModuleName: 'Car washing' } });
    const result = await supertest(app)
      .get(RouterLinks.getPackages.replace(':moduleId', String(carWash?.id) || ''))
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].id).toBe(createdPackage.id);
  });

  it('Should fail because no moduleId passed', async () => {
    await supertest(app)
      .get(RouterLinks.getPackages.replace(':moduleId', ''))
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.NotFound);
  });
});

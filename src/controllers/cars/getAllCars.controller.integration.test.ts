import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'databaseHelpers/client';
import randomstring from 'randomstring';

describe('Integration cars/getAllCars', () => {
  it('Should return one car as will be created', async () => {
    const randomTypename = randomstring.generate(7);
    const randomBodyTypename = randomstring.generate(7);
    const createResult = await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { create: { TypeName: randomTypename } },
        cars: {
          create: {
            Color: 'Red',
            Manufacturer: 'Mercedes',
            Model: '2010',
            PlateNumber: '58849',
            bodyTypes: { create: { TypeName: randomBodyTypename } },
          },
        },
      },
      select: {
        id: true,
      },
    });
    const result = await supertest(app).get(RouterLinks.getCars).set(commonHeaders(createResult.id)).send().expect(200);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body[0].Color).toBe('Red');
  });

  it('Should return empty array', async () => {
    const result = await supertest(app).get(RouterLinks.getCars).set(commonHeaders(99)).send().expect(200);
    expect(result.body.length).toEqual(0);
  });
});

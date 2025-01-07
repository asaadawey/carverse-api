import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from '@src/interfaces/enums';

describe('Integration cars/checkCarExist', () => {
  let randomPlateNumber: string;
  it('Should return true if he found car', async () => {
    randomPlateNumber = randomstring.generate(7);
    await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { create: { TypeName: randomstring.generate(7) } },
        cars: {
          create: {
            Color: 'Red',
            Manufacturer: 'Mercedes',
            Model: '2010',
            PlateNumber: randomPlateNumber,
            bodyTypes: { create: { TypeName: randomstring.generate(7) } },
          },
        },
      },
      select: {
        id: true,
        cars: {
          select: {
            id: true,
          },
        },
      },
    });
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.verifyCarNumber.replace(':plateNumber', randomPlateNumber))
      .set(commonHeaders())
      .expect(HTTPResponses.Success);
    expect(result.body.data.result).toEqual(true);
  });

  it('Should return false if car not exist', async () => {
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.verifyCarNumber.replace(':plateNumber', randomstring.generate(7)))
      .set(commonHeaders())
      .expect(HTTPResponses.Success);
    expect(result.body.data.result).toEqual(false);
  });
});

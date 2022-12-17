import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'databaseHelpers/client';
import randomstring from 'randomstring';

describe('Integration users/checkUserExist', () => {
  let userId: number;
  let bodyId: number;
  beforeAll(async () => {
    const randomTypename = randomstring.generate(7);
    const randomBodyTypename = randomstring.generate(7);
    const createUserResult = await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { create: { TypeName: randomTypename } },
      },
      select: {
        id: true,
      },
    });
    const createBodyResult = await prisma.bodyTypes.create({
      data: {
        TypeName: randomBodyTypename,
      },
      select: { id: true },
    });
    userId = createUserResult.id;
    bodyId = createBodyResult.id;
  });
  it('Should return false because plate number is nort right', async () => {
    const result = await supertest(app)
      .post(RouterLinks.addCar)
      .set(commonHeaders(userId))
      .send({
        BodyTypeID: bodyId,
        PlateNumber: '543369',
        PlateCity: 'Abu Dhabi',
        Color: 'Red',
        Manufacturer: 'Mer',
        Model: '2001',
      })
      .expect(400);

    expect(result.body.message).toBe('Bad request');
  });

  it('Should return one car as will be created', async () => {
    const result = await supertest(app)
      .post(RouterLinks.addCar)
      .set(commonHeaders(userId))
      .send({
        BodyTypeID: bodyId,
        PlateNumber: '54369',
        PlateCity: 'Abu Dhabi',
        Color: 'Red',
        Manufacturer: 'Mer',
        Model: '2001',
      })
      .expect(200);

    expect(result.body.result).toBe(true);
  });
});

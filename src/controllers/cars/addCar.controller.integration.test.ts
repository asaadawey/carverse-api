import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

describe('Integration cars/addCar', () => {
  let userId: number;
  let bodyId: number;
  beforeAll(async () => {
    const randomTypename = randomstring.generate(7);
    const randomBodyTypename = randomstring.generate(7);
    const createUserResult = await prisma.users.create({
      data: {
        Email: randomstring.generate(7),
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: randomstring.generate(7),
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
      .expect(HTTPResponses.ValidationError);

    expect(result.body.message).toBe(HTTPErrorString.BadRequest);
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
      .expect(HTTPResponses.Success);

    expect(result.body.result).toBe(true);
  });
});

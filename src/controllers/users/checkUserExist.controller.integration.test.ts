import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'databaseHelpers/client';
import randomstring from 'randomstring';

describe('Integration users/checkUserExist', () => {
  it('Should return true if he found user', async () => {
    const randomTypename = randomstring.generate(7);
    await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { create: { TypeName: randomTypename } },
      },
    });
    const result = await supertest(app)
      .post(RouterLinks.checkUserExist)
      .set(commonHeaders())
      .send({
        Email: 'testEmail',
        PhoneNumber: 'testPhone',
      })
      .expect(200);
    expect(result.body.result).toEqual(true);
  });

  it('Should fail because of schema validation', async () => {
    const result = await supertest(app)
      .post(RouterLinks.checkUserExist)
      .set(commonHeaders())
      .send({
        email: '1',
        password: '1',
        unkownArg: '1',
      })
      .expect(400);
    expect(result.body.message).toEqual('Bad request');
  });

  it('Should return false if user not exist', async () => {
    const randomstring1 = randomstring.generate(7);
    const randomstring2 = randomstring.generate(7);

    const result = await supertest(app)
      .post(RouterLinks.checkUserExist)
      .set(commonHeaders())
      .send({
        Email: randomstring1,
        PhoneNumber: randomstring2,
      })
      .expect(200);
    expect(result.body.result).toEqual(false);
  });
});

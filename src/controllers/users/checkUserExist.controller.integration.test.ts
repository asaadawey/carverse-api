import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';

describe('Integration users/checkUserExist', () => {
  const email = 'testEmail@email.com';
  it('Should return true if he found user', async () => {
    const randomTypename = randomstring.generate(7);
    await prisma.users.create({
      data: {
        Email: email,
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
        Email: email,
        PhoneNumber: 'testPhone',
      })
      .expect(HTTPResponses.Success);
    expect(result.body.data.result).toEqual(true);
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
      .expect(HTTPResponses.ValidationError);
    expect(result.body.data.message).toEqual(HTTPErrorString.BadRequest);
  });

  it('Should return false if user not exist', async () => {
    const result = await supertest(app)
      .post(RouterLinks.checkUserExist)
      .set(commonHeaders())
      .send({
        Email: email + 'ef',
        PhoneNumber: randomstring.generate(7),
      })
      .expect(HTTPResponses.Success);
    expect(result.body.data.result).toEqual(false);
  });
});

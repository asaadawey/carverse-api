import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from 'interfaces/enums';
import { encrypt } from 'utils/encrypt';

describe('Integration users/login', () => {
  it('Should fail if username and password is incorrect', async () => {
    console.log(RouterLinks.login);
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders(1, true))
      .send({
        email: '1',
        password: '1',
        encryptedClient: 'ds',
      })
      .expect(HTTPResponses.BusinessError);
    expect(result.body.message).toEqual(HTTPErrorMessages.InvalidUsernameOrPassowrd);
  });

  it('Should fail because of schema validation', async () => {
    console.log(RouterLinks.login);
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders(1, true))
      .send({
        email: '1',
        password: '1',
        unkownArg: '1',
      })
      .expect(HTTPResponses.ValidationError);

    expect(result.body.message).toEqual(HTTPErrorString.BadRequest);
  });

  it('Should success', async () => {
    const randomTypename = randomstring.generate(7);
    await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { create: { TypeName: randomTypename, AllowedClients: ['cp'] } },
      },
    });
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders(1, true))
      .send({
        email: 'testEmail',
        password: 'testPaswword',
        keepLoggedIn: false,
        encryptedClient: encrypt('cp'),
      })
      .expect(HTTPResponses.Success);
    expect(result.body.userInfo).toBeDefined();
  });
});

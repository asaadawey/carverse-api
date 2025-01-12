import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from '@src/constants/links';
import { commonHeaders } from '@src/helpers/testHelpers/defaults';
import prisma from '@src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from '@src/interfaces/enums';
import { encrypt, generateHashedString } from '@src/utils/encrypt';

describe('Integration users/login', () => {
  it('Should fail if username and password is incorrect', async () => {
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.login)
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
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.login)
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
    const randomEmail = randomstring.generate(7);
    const randomPhone = randomstring.generate(7);
    await prisma.users.create({
      data: {
        Email: randomEmail,
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation2on',
        Password: await generateHashedString('testPaswword'),
        PhoneNumber: randomPhone,
        isActive: true,
        customer: { create: {} },
        userTypes: { create: { TypeName: randomTypename, AllowedClients: ['cp'] } },
      },
    });
    const result = await supertest(app)
      .post(apiPrefix + RouterLinks.login)
      .set(commonHeaders(1, true))
      .send({
        email: randomEmail,
        password: 'testPaswword',
        keepLoggedIn: false,
        encryptedClient: encrypt('cp'),
      })
      .expect(HTTPResponses.Success);
    expect(result.body.data.userInfo).toBeDefined();
  });
});

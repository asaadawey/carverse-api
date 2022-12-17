import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'databaseHelpers/client';
import randomstring from 'randomstring';

describe('Integration users/login', () => {
  it('Should fail if username and password is incorrect', async () => {
    console.log(RouterLinks.login);
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders())
      .send({
        email: '1',
        password: '1',
      })
      .expect(409);
    expect(result.body.message).toEqual('Email or password incorrect');
  });

  it('Should fail because of schema validation', async () => {
    console.log(RouterLinks.login);
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders())
      .send({
        email: '1',
        password: '1',
        unkownArg: '1',
      })
      .expect(400);
    expect(result.body.message).toEqual('Bad request');
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
        userTypes: { create: { TypeName: randomTypename } },
      },
    });
    console.log(RouterLinks.login);
    const result = await supertest(app)
      .post(RouterLinks.login)
      .set(commonHeaders())
      .send({
        email: 'testEmail',
        password: 'testPaswword',
      })
      .expect(200);
    expect(result.body.userInfo).toBeDefined();
  });
});

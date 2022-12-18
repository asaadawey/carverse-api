import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'interfaces/enums';

describe('Integration users/register', () => {
  it('Should success', async () => {
    const randomTypename = randomstring.generate(7);
    await prisma.userTypes.create({
      data: {
        TypeName: randomTypename,
      },
    });
    const result = await supertest(app)
      .post(RouterLinks.register)
      .set(commonHeaders())
      .send({
        FirstName: 'FirstName test',
        LastName: 'LastName test',
        Email: 'Email test',
        Password: 'Password test',
        Nationality: 'Nationality test',
        PhoneNumber: 'PhoneNumber test',
        UserTypeName: randomTypename,
      })
      .expect(HTTPResponses.Success);
    expect(result.body.result).toEqual(true);
  });

  it('Should fail because of schema validation', async () => {
    console.log(RouterLinks.register);
    const result = await supertest(app)
      .post(RouterLinks.register)
      .set(commonHeaders())
      .send({
        email: '1',
        password: '1',
        unkownArg: '1',
      })
      .expect(HTTPResponses.ValidationError);
    expect(result.body.message).toEqual(HTTPErrorString.BadRequest);
  });
});

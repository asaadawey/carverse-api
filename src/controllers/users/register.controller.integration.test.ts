import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPErrorString, HTTPResponses } from 'src/interfaces/enums';

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

  it('Should success and make provider initially inactive until verification', async () => {
    const generatedFirstName = randomstring.generate(7);
    const generatedLastName = randomstring.generate(7);
    await prisma.userTypes.deleteMany({});

    await prisma.userTypes.create({
      data: {
        TypeName: 'Provider',
      },
    });
    const result = await supertest(app)
      .post(RouterLinks.register)
      .set(commonHeaders())
      .send({
        FirstName: generatedFirstName,
        LastName: generatedLastName,
        Email: 'Email test2',
        Password: 'Password test2',
        Nationality: 'Nationality test',
        PhoneNumber: 'PhoneNumber test2',
        UserTypeName: 'Provider',
      })
      .expect(HTTPResponses.Success);
    expect(result.body.result).toEqual(true);

    const createdUser = await prisma.users.findFirst({
      where: { AND: [{ FirstName: { equals: generatedFirstName } }, { LastName: { equals: generatedLastName } }] },
      select: { isActive: true },
    });

    expect(createdUser?.isActive).toBe(false);
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

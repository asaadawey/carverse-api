import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import { HTTPResponses, UserTypes } from 'src/interfaces/enums';

describe('Integration user/addDeleteRequest', () => {
  let customerUserId
  beforeAll(async () => {
    await prisma.users.deleteMany();
    const createResult = await prisma.users.create({
      data: {
        Email: 'testEmail',
        FirstName: 'testFirst',
        LastName: 'testLast',
        Nationality: 'testNation',
        Password: 'testPaswword',
        PhoneNumber: 'testPhone',
        userTypes: { connectOrCreate: { where: { TypeName: UserTypes.Customer }, create: { TypeName: UserTypes.Customer } } },
      },
      select: {
        id: true,
      },
    });

    customerUserId = createResult.id
  })

  it('Should add delete request', async () => {

    const result = await supertest(app)
      .post(`${RouterLinks.addDeleteRequest.replace(':userId?', "")}`)
      .set(commonHeaders(customerUserId))
      .send()
      .expect(HTTPResponses.Success);

    expect(result.body.result).toBeTruthy();
  });

  it('Should fail because customer is trying to access other user id', async () => {
    const createResult = await prisma.users.create({
      data: {
        Email: 'testEmail2',
        FirstName: 'testFirst2',
        LastName: 'testLast2',
        Nationality: 'testNation2',
        Password: 'testPaswword2',
        PhoneNumber: 'testPhone2',
        userTypes: { connectOrCreate: { where: { TypeName: UserTypes.Customer }, create: { TypeName: UserTypes.Customer } } },
      },
      select: {
        id: true,
      },
    });
    const result = await supertest(app)
      .post(`${RouterLinks.addDeleteRequest.replace(':userId?', customerUserId)}`)
      .set(commonHeaders(createResult.id, false, { extrauser: { userType: UserTypes.Customer } }))
      .send()
      .expect(HTTPResponses.Unauthorised);

    console.log({ result })
  });

  it('Should success and process delete user when admin process it', async () => {
    const createResult = await prisma.users.create({
      data: {
        Email: 'testEmail23',
        FirstName: 'testFirst2',
        LastName: 'testLast2',
        Nationality: 'testNation23',
        Password: 'testPaswword2',
        PhoneNumber: 'testPhone24',
        userTypes: { connectOrCreate: { where: { TypeName: UserTypes.Admin }, create: { TypeName: UserTypes.Admin } } },
      },
      select: {
        id: true,
      },
    });
    const result = await supertest(app)
      .post(`${RouterLinks.addDeleteRequest.replace(':userId?', customerUserId)}`)
      .set(commonHeaders(createResult.id, false, { extrauser: { userType: UserTypes.Admin } }))
      .send()
      .expect(HTTPResponses.Success);

    const customerAfter = await prisma.users.findUnique({ where: { id: customerUserId } })

    expect(customerAfter?.isActive).toBe(false);
  });
});

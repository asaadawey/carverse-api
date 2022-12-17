import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'databaseHelpers/client';
import randomstring from 'randomstring';

describe('Integration cars/getAllBodyTypes', () => {
  it('Should return one car as will be created', async () => {
    const generatedTypeName = randomstring.generate(7);
    await prisma.bodyTypes.create({
      data: { TypeName: generatedTypeName },
    });
    const result = await supertest(app).get(RouterLinks.getBodyTypes).set(commonHeaders()).send().expect(200);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body[0].TypeName).toBe(generatedTypeName);
  });
});

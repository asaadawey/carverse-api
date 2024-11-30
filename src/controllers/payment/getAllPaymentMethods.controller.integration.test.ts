import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration paymentMethods/getAllPaymentMethods', () => {
  it('Should return one payment method', async () => {
    const generatedTypeName = randomstring.generate(7);
    await prisma.paymentMethods.create({
      data: { MethodName: generatedTypeName, MethodDescription: '' },
    });
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.getAllPaymentMethods)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);

    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data[0].MethodName).toBe(generatedTypeName);
  });
});

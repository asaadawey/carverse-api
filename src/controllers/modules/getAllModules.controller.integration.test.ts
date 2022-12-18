import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'constants/links';
import { commonHeaders } from 'helpers/testHelpers/defaults';
import prisma from 'helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'interfaces/enums';

describe('Integration modules/getAllModules', () => {
  it('Should success', async () => {
    const generatedTypeName = randomstring.generate(7);
    await prisma.modules.create({
      data: { ModuleName: generatedTypeName, ModuleDescription: 'Des', ModuleIconLink: '/dd/' },
    });
    const result = await supertest(app)
      .get(RouterLinks.getModules)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.length).toBe(1);
    expect(result.body[0].ModuleName).toBe(generatedTypeName);
  });
});

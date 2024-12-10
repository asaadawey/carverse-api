import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration constants/getAllConstants', () => {
  it('Should success', async () => {
    const generatedTypeName = randomstring.generate(7);
    await prisma.modules.create({
      data: { ModuleName: generatedTypeName, ModuleDescription: 'Des', ModuleIconLink: '/dd/' },
    });
    const result = await supertest(await app())
      .get(apiPrefix + RouterLinks.getModules)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.length).toBe(1);
    expect(result.body.data[0].ModuleName).toBe(generatedTypeName);
  });
});

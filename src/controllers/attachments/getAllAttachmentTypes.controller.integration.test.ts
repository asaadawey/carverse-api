import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration attachments/getAllAttachmentTypes', () => {
  it('Should return one type', async () => {
    const generatedTypeName = randomstring.generate(7);
    await prisma.attachmentTypes.create({
      data: { TypeName: generatedTypeName },
    });
    const result = await supertest(app)
      .get(apiPrefix + RouterLinks.getAllAttachmentTypes)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data.some((type: any) => type.TypeName === generatedTypeName)).toBe(true);
  });
});

import supertest from 'supertest';
import app from '../../index';
import { RouterLinks } from 'src/constants/links';
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
      .get(RouterLinks.getAllAttachmentTypes)
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body)).toBe(true);
    expect(result.body.some((type: any) => type.TypeName === generatedTypeName)).toBe(true);
  });
});

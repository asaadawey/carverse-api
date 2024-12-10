import supertest from 'supertest';
import app from '../../index';
import { apiPrefix, RouterLinks } from 'src/constants/links';
import { commonHeaders } from 'src/helpers/testHelpers/defaults';
import prisma from 'src/helpers/databaseHelpers/client';
import randomstring from 'randomstring';
import { HTTPResponses } from 'src/interfaces/enums';

describe('Integration attachments/getAllAttachmentTypes', () => {
  let createdAttachmentType: string = '';
  let generatedAttachmentName = randomstring.generate(7);
  beforeAll(async () => {
    const createdAttachment = await prisma.attachments.create({
      data: {
        Description: 'Test',
        Name: generatedAttachmentName,
        attachmentType: {
          create: {
            TypeName: randomstring.generate(5),
          },
        },
      },
      select: {
        attachmentType: {
          select: {
            id: true,
            TypeName: true,
          },
        },
      },
    });

    createdAttachmentType = createdAttachment.attachmentType.TypeName;
  });
  it('Should return one type', async () => {
    const result = await supertest(await app())
      .get(apiPrefix + RouterLinks.getListOfAttachments.replace(':typeName', '' + createdAttachmentType))
      .set(commonHeaders())
      .send()
      .expect(HTTPResponses.Success);
    expect(Array.isArray(result.body.data)).toBe(true);
    expect(result.body.data[0].Name).toBe(generatedAttachmentName);
  });
});

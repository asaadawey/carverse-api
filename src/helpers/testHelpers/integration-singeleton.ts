import prisma from 'databaseHelpers/client';
import { Prisma } from '@prisma/client';

async function cleanDatabase() {
  const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);
  for (let model of modelNames) {
    try {
      //@ts-ignore
      await prisma[model].deleteMany();
    } catch (e) {
      console.error({ e });
    }
  }
}

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$executeRawUnsafe('SELECT 1');
});

afterAll(async () => {
  await prisma.$disconnect();
});

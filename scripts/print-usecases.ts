import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const tools = await prisma.tool.findMany({
    where: { useCases: { not: undefined } },
    select: { name: true, useCases: true }
  });
  console.log(JSON.stringify(tools, null, 2));
  await prisma.$disconnect();
})(); 
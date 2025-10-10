import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTools() {
  try {
    console.log('Verifying uploaded tools...\n');

    // Get total count
    const totalCount = await prisma.tool.count();
    console.log(`Total tools in database: ${totalCount}`);

    // Get tools by category
    const toolsByCategory = await prisma.tool.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    console.log('\nTools by category:');
    toolsByCategory.forEach(group => {
      console.log(`  ${group.category}: ${group._count.category}`);
    });

    // Get a few sample tools
    console.log('\nSample tools:');
    const sampleTools = await prisma.tool.findMany({
      take: 5,
      select: {
        name: true,
        category: true,
        status: true,
        link: true
      }
    });

    sampleTools.forEach(tool => {
      console.log(`  - ${tool.name} (${tool.category}) - ${tool.status}`);
    });

    console.log('\n✅ Tools verification completed successfully!');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyTools();

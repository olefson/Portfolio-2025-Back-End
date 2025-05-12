import { PrismaClient, ToolCategory } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ToolData {
  id: string;
  title: string;
  status: string;
  category: string;
  description: string;
  howToUse: string[];
  caveats: string[];
  url: string;
  useCases: {
    title: string;
    items: string[];
  }[];
  addedOn: string;
  recommendedBy: string | null;
}

function mapCategory(category: string): ToolCategory {
  const categoryMap: { [key: string]: ToolCategory } = {
    'AI': 'AI',
    'Productivity': 'Productivity',
    'Development': 'Development',
    'Communication': 'Communication',
    'Design': 'Design',
    'Learning': 'Other',
    'Hardware': 'Other',
    'Other': 'Other'
  } as const;

  return categoryMap[category] || 'Other';
}

async function migrateTools() {
  try {
    // Read the tools.json file
    const toolsPath = path.join(process.cwd(), '..', 'Front-End/src/data/tools.json');
    const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    const tools: ToolData[] = toolsData.tools;

    console.log(`Found ${tools.length} tools to migrate`);

    // Process each tool
    for (const tool of tools) {
      // Convert category using mapping function
      const category = mapCategory(tool.category);

      // Convert date string to Date object
      const [month, day, year] = tool.addedOn ? tool.addedOn.split('-').map(Number) : [1, 1, 2025];
      const acquired = new Date(year, month - 1, day);

      try {
        // Debug: Log useCases for each tool
        console.log(tool.title, tool.useCases);
        // Create tool in database
        await prisma.tool.create({
          data: {
            name: tool.title,
            description: tool.description,
            category,
            iconUrl: `/images/tools/${tool.id}.svg`,
            link: tool.url,
            status: tool.status,
            acquired,
            createdBy: 'admin', // Default admin user
            useCases: tool.useCases,
          },
        });

        console.log(`Migrated tool: ${tool.title}`);
      } catch (error) {
        console.error(`Failed to migrate tool ${tool.title}:`, error);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTools(); 
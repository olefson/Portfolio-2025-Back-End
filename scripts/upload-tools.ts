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
  addedOn: string | null;
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

async function uploadTools() {
  try {
    console.log('Starting tools upload...');
    
    // Read the tools.json file
    const toolsPath = path.join(process.cwd(), '..', 'Portfolio-2025-Front-End/src/data/tools.json');
    const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
    const tools: ToolData[] = toolsData.tools;

    console.log(`Found ${tools.length} tools to upload`);

    // Clear existing tools first
    console.log('Clearing existing tools...');
    await prisma.tool.deleteMany({});

    // Process each tool
    for (const tool of tools) {
      try {
        // Convert category using mapping function
        const category = mapCategory(tool.category);

        // Create tool in database
        await prisma.tool.create({
          data: {
            name: tool.title,
            description: tool.description,
            category,
            iconUrl: `/images/tools/${tool.id}.svg`,
            link: tool.url,
            status: tool.status,
            useCases: tool.useCases,
          },
        });

        console.log(`✓ Uploaded tool: ${tool.title}`);
      } catch (error) {
        console.error(`✗ Failed to upload tool ${tool.title}:`, error);
      }
    }

    console.log(`\n🎉 Successfully uploaded ${tools.length} tools to the database!`);
  } catch (error) {
    console.error('Error during upload:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upload
uploadTools();

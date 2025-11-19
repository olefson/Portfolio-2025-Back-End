import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function exportDatabase() {
  try {
    console.log('Exporting database...');

    // Export all data
    const data = {
      tools: await prisma.tool.findMany(),
      processes: await prisma.process.findMany(),
      projects: await prisma.project.findMany(),
      jobs: await prisma.job.findMany(),
      education: await prisma.education.findMany(),
    };

    // Save to JSON file
    const exportPath = path.join(process.cwd(), 'database-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

    console.log(`✅ Database exported to: ${exportPath}`);
    console.log(`📊 Exported ${data.tools.length} tools, ${data.processes.length} processes, ${data.projects.length} projects, ${data.jobs.length} jobs, ${data.education.length} education records`);
  } catch (error) {
    console.error('Error exporting database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();



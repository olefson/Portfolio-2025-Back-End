import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

interface DatabaseExport {
  tools: any[];
  processes: any[];
  projects: any[];
  jobs: any[];
  education: any[];
}

async function importDatabase() {
  try {
    console.log('Importing database...');

    // Read the JSON file
    const importPath = path.join(process.cwd(), 'database-export.json');
    const fileContent = fs.readFileSync(importPath, 'utf8');
    const data: DatabaseExport = JSON.parse(fileContent);

    // Import in order (respecting foreign keys if any)
    console.log(`📥 Importing ${data.tools.length} tools...`);
    if (data.tools.length > 0) {
      await prisma.tool.deleteMany({});
      await prisma.tool.createMany({ data: data.tools });
    }

    console.log(`📥 Importing ${data.processes.length} processes...`);
    if (data.processes.length > 0) {
      await prisma.process.deleteMany({});
      await prisma.process.createMany({ data: data.processes });
    }

    console.log(`📥 Importing ${data.projects.length} projects...`);
    if (data.projects.length > 0) {
      await prisma.project.deleteMany({});
      await prisma.project.createMany({ data: data.projects });
    }

    console.log(`📥 Importing ${data.jobs.length} jobs...`);
    if (data.jobs.length > 0) {
      await prisma.job.deleteMany({});
      await prisma.job.createMany({ data: data.jobs });
    }

    console.log(`📥 Importing ${data.education.length} education records...`);
    if (data.education.length > 0) {
      await prisma.education.deleteMany({});
      await prisma.education.createMany({ data: data.education });
    }

    console.log('✅ Database imported successfully!');
  } catch (error) {
    console.error('Error importing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importDatabase();



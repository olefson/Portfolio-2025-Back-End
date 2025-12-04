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

/**
 * Checks if the database is empty and auto-imports dev data if needed.
 * Only runs in development environment to avoid affecting production.
 */
async function checkAndImportDatabase() {
  // Only run in development
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'prod';
  const forceImport = process.env.FORCE_DB_IMPORT === 'true';
  
  if (!isDev && !forceImport) {
    console.log('⏭️  Skipping database auto-import (not in dev mode)');
    await prisma.$disconnect();
    return;
  }

  try {
    // Check if database has data
    const [toolCount, processCount, projectCount] = await Promise.all([
      prisma.tool.count(),
      prisma.process.count(),
      prisma.project.count(),
    ]);

    const hasData = toolCount > 0 || processCount > 0 || projectCount > 0;

    if (hasData && !forceImport) {
      console.log('✅ Database already has data. Skipping import.');
      console.log(`   Tools: ${toolCount}, Processes: ${processCount}, Projects: ${projectCount}`);
      await prisma.$disconnect();
      return;
    }

    // Check if export file exists
    const importPath = path.join(process.cwd(), 'database-export.json');
    if (!fs.existsSync(importPath)) {
      console.log('⚠️  database-export.json not found. Skipping import.');
      await prisma.$disconnect();
      return;
    }

    console.log('📥 Database is empty or force import requested. Importing dev data...');
    
    // Read and import the JSON file
    const fileContent = fs.readFileSync(importPath, 'utf8');
    const data: DatabaseExport = JSON.parse(fileContent);

    // Import in order (respecting foreign keys if any)
    if (data.tools.length > 0) {
      console.log(`📥 Importing ${data.tools.length} tools...`);
      await prisma.tool.deleteMany({});
      await prisma.tool.createMany({ data: data.tools });
    }

    if (data.processes.length > 0) {
      console.log(`📥 Importing ${data.processes.length} processes...`);
      await prisma.process.deleteMany({});
      await prisma.process.createMany({ data: data.processes });
    }

    if (data.projects.length > 0) {
      console.log(`📥 Importing ${data.projects.length} projects...`);
      await prisma.project.deleteMany({});
      await prisma.project.createMany({ data: data.projects });
    }

    if (data.jobs && data.jobs.length > 0) {
      console.log(`📥 Importing ${data.jobs.length} jobs...`);
      await prisma.job.deleteMany({});
      await prisma.job.createMany({ data: data.jobs });
    }

    if (data.education && data.education.length > 0) {
      console.log(`📥 Importing ${data.education.length} education records...`);
      await prisma.education.deleteMany({});
      await prisma.education.createMany({ data: data.education });
    }

    console.log('✅ Dev database imported successfully!');
  } catch (error) {
    console.error('❌ Error checking/importing database:', error);
    // Don't exit - let the server start anyway
    console.log('⚠️  Continuing server startup despite import error...');
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndImportDatabase();
}

export { checkAndImportDatabase };














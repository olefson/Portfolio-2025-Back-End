import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Run Prisma migrations
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    
    // Seed the database
    await seedDatabase();
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedDatabase() {
  console.log('Seeding database...');

  // Seed Tools
  const tools = [
    {
      name: 'Next.js',
      description: 'The React Framework for Production',
      category: 'Frontend',
      iconUrl: '/images/tools/nextjs.svg',
      link: 'https://nextjs.org'
    },
    {
      name: 'TypeScript',
      description: 'JavaScript with syntax for types',
      category: 'Language',
      iconUrl: '/images/tools/typescript.svg',
      link: 'https://www.typescriptlang.org'
    }
  ];

  // Seed Projects
  const projects = [
    {
      title: 'Portfolio Website',
      description: 'A modern portfolio website built with Next.js and TailwindCSS',
      imageUrl: '/images/projects/portfolio.png',
      link: 'https://github.com/yourusername/portfolio',
      tags: ['Next.js', 'TypeScript', 'TailwindCSS']
    }
  ];

  // Seed Processes
  const processes = [
    {
      title: 'Development Workflow',
      description: 'My typical development process',
      steps: [
        'Plan and design',
        'Set up project structure',
        'Implement core features',
        'Test and debug',
        'Deploy and monitor'
      ]
    }
  ];

  // Seed MindfulFlow
  const mindfulFlows = [
    {
      title: 'Daily Learning',
      description: 'My daily learning routine',
      category: 'Learning',
      link: 'https://audible.com'
    }
  ];

  // Insert data
  await prisma.tool.createMany({ data: tools });
  await prisma.project.createMany({ data: projects });
  await prisma.process.createMany({ data: processes });
  await prisma.mindfulFlow.createMany({ data: mindfulFlows });

  console.log('Database seeded successfully!');
}

// Run the setup
setupDatabase(); 
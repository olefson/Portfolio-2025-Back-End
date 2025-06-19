import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all tools
router.get('/', async (req, res) => {
  const tools = await prisma.tool.findMany();
  res.json(tools);
});

// Get a single tool (including useCases)
router.get('/:id', async (req, res) => {
  const tool = await prisma.tool.findUnique({ where: { id: req.params.id } });
  res.json(tool);
});

// Create a tool
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const {
      name, description, category, iconUrl, link, status, useCases
    } = data;
    const tool = await prisma.tool.create({
      data: {
        name,
        description,
        category,
        iconUrl,
        link,
        status,
        useCases
      }
    });
    res.json(tool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Failed to create tool', details: error });
  }
});

// Update a tool (including useCases)
router.put('/:id', async (req, res) => {
  const data = req.body;
  const tool = await prisma.tool.update({
    where: { id: req.params.id },
    data,
  });
  res.json(tool);
});

// Delete a tool
router.delete('/:id', async (req, res) => {
  await prisma.tool.delete({ where: { id: req.params.id } });
  res.json({ message: 'Tool deleted' });
});

// Add a use case
router.post('/:id/usecases', async (req, res) => {
  const { useCase } = req.body;
  const tool = await prisma.tool.findUnique({ where: { id: req.params.id } });
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  const useCases = Array.isArray(tool.useCases) ? tool.useCases : [];
  useCases.push(useCase);
  const updated = await prisma.tool.update({
    where: { id: req.params.id },
    data: { useCases },
  });
  res.json(updated);
});

// Update a use case by index
router.put('/:id/usecases/:ucIndex', async (req, res) => {
  const { useCase } = req.body;
  const ucIndex = parseInt(req.params.ucIndex, 10);
  const tool = await prisma.tool.findUnique({ where: { id: req.params.id } });
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  const useCases = Array.isArray(tool.useCases) ? tool.useCases : [];
  useCases[ucIndex] = useCase;
  const updated = await prisma.tool.update({
    where: { id: req.params.id },
    data: { useCases },
  });
  res.json(updated);
});

// Delete a use case by index
router.delete('/:id/usecases/:ucIndex', async (req, res) => {
  const ucIndex = parseInt(req.params.ucIndex, 10);
  const tool = await prisma.tool.findUnique({ where: { id: req.params.id } });
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  const useCases = Array.isArray(tool.useCases) ? tool.useCases : [];
  useCases.splice(ucIndex, 1);
  const updated = await prisma.tool.update({
    where: { id: req.params.id },
    data: { useCases },
  });
  res.json(updated);
});

export default router; 
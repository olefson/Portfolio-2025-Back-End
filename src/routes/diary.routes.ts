import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { diarySchema } from '../validation/schemas';
import { DiaryRepository } from '../data/repositories/DiaryRepository';
import { DiaryService } from '../data/services/DiaryService';

const router = Router();
const prisma = new PrismaClient();

// Initialize repository and service
const diaryRepository = new DiaryRepository(prisma);
const diaryService = new DiaryService(diaryRepository);

// Get all diary entries (ordered by date descending - most recent first)
router.get('/', async (req, res) => {
  try {
    const entries = await diaryService.findAll();
    res.json(entries);
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ error: 'Failed to fetch diary entries', details: error instanceof Error ? error.message : error });
  }
});

// Get a single diary entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await diaryService.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found' });
    }
    res.json(entry);
  } catch (error) {
    console.error('Error fetching diary entry:', error);
    res.status(500).json({ error: 'Failed to fetch diary entry', details: error instanceof Error ? error.message : error });
  }
});

// Create a diary entry
router.post('/', validate(diarySchema), async (req, res) => {
  try {
    const data = req.body;
    
    // Convert date string to Date object
    const diaryData = {
      ...data,
      date: new Date(data.date),
    };
    
    const entry = await diaryService.create(diaryData);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating diary entry:', error);
    res.status(500).json({ error: 'Failed to create diary entry', details: error instanceof Error ? error.message : error });
  }
});

// Update a diary entry
router.put('/:id', validate(diarySchema), async (req, res) => {
  try {
    const data = req.body;
    
    // Convert date string to Date object if provided
    const diaryData = {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    };
    
    const entry = await diaryService.update(req.params.id, diaryData);
    res.json(entry);
  } catch (error) {
    console.error('Error updating diary entry:', error);
    res.status(500).json({ error: 'Failed to update diary entry', details: error instanceof Error ? error.message : error });
  }
});

// Delete a diary entry
router.delete('/:id', async (req, res) => {
  try {
    await diaryService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ error: 'Failed to delete diary entry', details: error instanceof Error ? error.message : error });
  }
});

export default router;


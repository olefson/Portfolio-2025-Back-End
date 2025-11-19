import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { educationSchema } from '../validation/schemas';
import { EducationRepository } from '../data/repositories/EducationRepository';
import { EducationService } from '../data/services/EducationService';

const router = Router();
const prisma = new PrismaClient();

// Initialize repository and service
const educationRepository = new EducationRepository(prisma);
const educationService = new EducationService(educationRepository);

// Get all education records (ordered by startDate descending - most recent first)
router.get('/', async (req, res) => {
  try {
    const education = await educationService.findAll();
    res.json(education);
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ error: 'Failed to fetch education', details: error instanceof Error ? error.message : error });
  }
});

// Get a single education record
router.get('/:id', async (req, res) => {
  try {
    const education = await educationService.findById(req.params.id);
    if (!education) {
      return res.status(404).json({ error: 'Education record not found' });
    }
    res.json(education);
  } catch (error) {
    console.error('Error fetching education:', error);
    res.status(500).json({ error: 'Failed to fetch education', details: error instanceof Error ? error.message : error });
  }
});

// Create an education record
router.post('/', validate(educationSchema), async (req, res) => {
  try {
    const data = req.body;
    
    // Convert date strings to Date objects if needed
    const educationData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    };
    
    const education = await educationService.create(educationData);
    res.status(201).json(education);
  } catch (error) {
    console.error('Error creating education:', error);
    res.status(500).json({ error: 'Failed to create education', details: error instanceof Error ? error.message : error });
  }
});

// Update an education record
router.put('/:id', validate(educationSchema), async (req, res) => {
  try {
    const data = req.body;
    
    // Convert date strings to Date objects if needed
    const educationData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined),
    };
    
    const education = await educationService.update(req.params.id, educationData);
    res.json(education);
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ error: 'Failed to update education', details: error instanceof Error ? error.message : error });
  }
});

// Delete an education record
router.delete('/:id', async (req, res) => {
  try {
    await educationService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ error: 'Failed to delete education', details: error instanceof Error ? error.message : error });
  }
});

export default router;


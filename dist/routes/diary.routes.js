"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const DiaryRepository_1 = require("../data/repositories/DiaryRepository");
const DiaryService_1 = require("../data/services/DiaryService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialize repository and service
const diaryRepository = new DiaryRepository_1.DiaryRepository(prisma);
const diaryService = new DiaryService_1.DiaryService(diaryRepository);
// Get all diary entries (ordered by date descending - most recent first)
router.get('/', async (req, res) => {
    try {
        const entries = await diaryService.findAll();
        res.json(entries);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching diary entry:', error);
        res.status(500).json({ error: 'Failed to fetch diary entry', details: error instanceof Error ? error.message : error });
    }
});
// Create a diary entry
router.post('/', (0, validate_1.validate)(schemas_1.diarySchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date string to Date object
        const diaryData = Object.assign(Object.assign({}, data), { date: new Date(data.date) });
        const entry = await diaryService.create(diaryData);
        res.status(201).json(entry);
    }
    catch (error) {
        console.error('Error creating diary entry:', error);
        res.status(500).json({ error: 'Failed to create diary entry', details: error instanceof Error ? error.message : error });
    }
});
// Update a diary entry
router.put('/:id', (0, validate_1.validate)(schemas_1.diarySchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date string to Date object if provided
        const diaryData = Object.assign(Object.assign({}, data), { date: data.date ? new Date(data.date) : undefined });
        const entry = await diaryService.update(req.params.id, diaryData);
        res.json(entry);
    }
    catch (error) {
        console.error('Error updating diary entry:', error);
        res.status(500).json({ error: 'Failed to update diary entry', details: error instanceof Error ? error.message : error });
    }
});
// Delete a diary entry
router.delete('/:id', async (req, res) => {
    try {
        await diaryService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting diary entry:', error);
        res.status(500).json({ error: 'Failed to delete diary entry', details: error instanceof Error ? error.message : error });
    }
});
exports.default = router;

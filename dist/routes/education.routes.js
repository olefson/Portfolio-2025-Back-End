"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const EducationRepository_1 = require("../data/repositories/EducationRepository");
const EducationService_1 = require("../data/services/EducationService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialize repository and service
const educationRepository = new EducationRepository_1.EducationRepository(prisma);
const educationService = new EducationService_1.EducationService(educationRepository);
// Get all education records (ordered by startDate descending - most recent first)
router.get('/', async (req, res) => {
    try {
        const education = await educationService.findAll();
        res.json(education);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching education:', error);
        res.status(500).json({ error: 'Failed to fetch education', details: error instanceof Error ? error.message : error });
    }
});
// Create an education record
router.post('/', (0, validate_1.validate)(schemas_1.educationSchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date strings to Date objects if needed
        const educationData = Object.assign(Object.assign({}, data), { startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null });
        const education = await educationService.create(educationData);
        res.status(201).json(education);
    }
    catch (error) {
        console.error('Error creating education:', error);
        res.status(500).json({ error: 'Failed to create education', details: error instanceof Error ? error.message : error });
    }
});
// Update an education record
router.put('/:id', (0, validate_1.validate)(schemas_1.educationSchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date strings to Date objects if needed
        const educationData = Object.assign(Object.assign({}, data), { startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined) });
        const education = await educationService.update(req.params.id, educationData);
        res.json(education);
    }
    catch (error) {
        console.error('Error updating education:', error);
        res.status(500).json({ error: 'Failed to update education', details: error instanceof Error ? error.message : error });
    }
});
// Delete an education record
router.delete('/:id', async (req, res) => {
    try {
        await educationService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting education:', error);
        res.status(500).json({ error: 'Failed to delete education', details: error instanceof Error ? error.message : error });
    }
});
exports.default = router;

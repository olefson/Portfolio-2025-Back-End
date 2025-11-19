"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../validation/schemas");
const JobRepository_1 = require("../data/repositories/JobRepository");
const JobService_1 = require("../data/services/JobService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Initialize repository and service
const jobRepository = new JobRepository_1.JobRepository(prisma);
const jobService = new JobService_1.JobService(jobRepository);
// Get all jobs (ordered by startDate descending - most recent first)
router.get('/', async (req, res) => {
    try {
        const jobs = await jobService.findAll();
        res.json(jobs);
    }
    catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs', details: error instanceof Error ? error.message : error });
    }
});
// Get a single job
router.get('/:id', async (req, res) => {
    try {
        const job = await jobService.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    }
    catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).json({ error: 'Failed to fetch job', details: error instanceof Error ? error.message : error });
    }
});
// Create a job
router.post('/', (0, validate_1.validate)(schemas_1.jobSchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date strings to Date objects if needed
        const jobData = Object.assign(Object.assign({}, data), { startDate: new Date(data.startDate), endDate: data.endDate ? new Date(data.endDate) : null });
        const job = await jobService.create(jobData);
        res.status(201).json(job);
    }
    catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ error: 'Failed to create job', details: error instanceof Error ? error.message : error });
    }
});
// Update a job
router.put('/:id', (0, validate_1.validate)(schemas_1.jobSchema), async (req, res) => {
    try {
        const data = req.body;
        // Convert date strings to Date objects if needed
        const jobData = Object.assign(Object.assign({}, data), { startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : undefined) });
        const job = await jobService.update(req.params.id, jobData);
        res.json(job);
    }
    catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ error: 'Failed to update job', details: error instanceof Error ? error.message : error });
    }
});
// Delete a job
router.delete('/:id', async (req, res) => {
    try {
        await jobService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job', details: error instanceof Error ? error.message : error });
    }
});
exports.default = router;

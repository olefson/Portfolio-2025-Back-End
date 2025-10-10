"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const validate_1 = require("./middleware/validate");
const schemas_1 = require("./validation/schemas");
const fileUpload_1 = require("./utils/fileUpload");
const tools_routes_1 = __importDefault(require("./routes/tools.routes"));
// Import repositories and services
const ToolRepository_1 = require("./data/repositories/ToolRepository");
const ProjectRepository_1 = require("./data/repositories/ProjectRepository");
const ProcessRepository_1 = require("./data/repositories/ProcessRepository");
const ToolService_1 = require("./data/services/ToolService");
const ProjectService_1 = require("./data/services/ProjectService");
const ProcessService_1 = require("./data/services/ProcessService");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Configure middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from uploads directory with proper headers
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'), {
    setHeaders: (res, path) => {
        // Set proper MIME types for different file types
        if (path.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        else if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
        else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        }
        else if (path.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        }
        // Enable CORS for static files
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
    }
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'https://scholarship-frontend-git-main-impactisglobals-projects.vercel.app',
        'https://scholarship-frontend.vercel.app',
        'https://impactisglobal.org',
        'https://www.impactisglobal.org'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
// Add CORS headers middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
// Initialize repositories
const toolRepository = new ToolRepository_1.ToolRepository(prisma);
const projectRepository = new ProjectRepository_1.ProjectRepository(prisma);
const processRepository = new ProcessRepository_1.ProcessRepository(prisma);
// Initialize services
const toolService = new ToolService_1.ToolService(toolRepository);
const projectService = new ProjectService_1.ProjectService(projectRepository);
const processService = new ProcessService_1.ProcessService(processRepository);
// Test log endpoint
app.get('/test-log', (req, res) => {
    console.log('Test log endpoint hit!');
    res.json({ ok: true });
});
// Add this before any other routes
app.post('/test', (req, res) => {
    console.log('Test endpoint hit!');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    res.json({
        message: 'Test successful',
        receivedBody: req.body,
        receivedHeaders: req.headers
    });
});
console.log('Server file loaded!');
// Register the new tools router
app.use('/api/tools', tools_routes_1.default);
// Image upload endpoint
app.post('/api/upload', fileUpload_1.upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
// Projects endpoints
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await projectService.findAll();
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await projectService.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});
// Handle project creation with image upload (multipart)
app.post('/api/projects/upload', fileUpload_1.upload.single('image'), (0, validate_1.validate)(schemas_1.projectSchema), async (req, res) => {
    try {
        const projectData = Object.assign(Object.assign({}, req.body), { tags: JSON.parse(req.body.tags), imagePath: req.file ? `/uploads/${req.file.filename}` : null });
        const project = await projectService.create(projectData);
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Handle project creation with existing image (JSON)
app.post('/api/projects', (0, validate_1.validate)(schemas_1.projectSchema), async (req, res) => {
    try {
        const projectData = Object.assign(Object.assign({}, req.body), { tags: req.body.tags // Already an array from frontend
         });
        const project = await projectService.create(projectData);
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
// Handle project update with image upload
app.put('/api/projects/:id', fileUpload_1.upload.single('image'), (0, validate_1.validate)(schemas_1.projectSchema), async (req, res) => {
    try {
        const projectData = Object.assign(Object.assign({}, req.body), { tags: req.body.tags, imagePath: req.file ? `/uploads/${req.file.filename}` : req.body.imagePath });
        const project = await projectService.update(req.params.id, projectData);
        res.json(project);
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Failed to update project', details: error instanceof Error ? error.message : 'Unknown error' });
    }
});
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await projectService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});
// Processes endpoints
app.get('/api/processes', async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            status: req.query.status,
            search: req.query.search
        };
        const processes = await processService.findAll(filters);
        res.json(processes);
    }
    catch (error) {
        console.error('Error fetching processes:', error);
        res.status(500).json({ error: 'Failed to fetch processes', details: error instanceof Error ? error.message : error });
    }
});
app.get('/api/processes/:id', async (req, res) => {
    try {
        const process = await processService.findById(req.params.id);
        if (!process) {
            return res.status(404).json({ error: 'Process not found' });
        }
        res.json(process);
    }
    catch (error) {
        console.error('Error fetching process:', error);
        res.status(500).json({ error: 'Failed to fetch process', details: error instanceof Error ? error.message : error });
    }
});
app.post('/api/processes', (0, validate_1.validate)(schemas_1.processSchema), async (req, res) => {
    try {
        console.log('Process creation endpoint received request:');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('Raw body:', req.body);
        const process = await processService.create(req.body);
        console.log('Successfully created process:', process);
        res.status(201).json(process);
    }
    catch (error) {
        console.error('Error creating process:', error);
        res.status(500).json({ error: 'Failed to create process', details: error instanceof Error ? error.message : error });
    }
});
app.put('/api/processes/:id', (0, validate_1.validate)(schemas_1.processSchema), async (req, res) => {
    try {
        const process = await processService.update(req.params.id, req.body);
        res.json(process);
    }
    catch (error) {
        console.error('Error updating process:', error);
        res.status(500).json({ error: 'Failed to update process', details: error instanceof Error ? error.message : error });
    }
});
app.delete('/api/processes/:id', async (req, res) => {
    try {
        await processService.delete(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting process:', error);
        res.status(500).json({ error: 'Failed to delete process', details: error instanceof Error ? error.message : error });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
console.log('App is about to listen!');
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

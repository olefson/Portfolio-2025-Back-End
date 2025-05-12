import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import { PrismaClient, ToolCategory, ProcessCategory } from '@prisma/client';
import { validate } from './middleware/validate';
import { 
  toolSchema, 
  projectSchema, 
  processSchema
} from './validation/schemas';
import { upload, getPublicUrl } from './utils/fileUpload';
import authRoutes from './routes/auth.routes';
import passport from './services/auth.service';
import { isAuthenticated } from './services/auth.service';
import toolsRoutes from './routes/tools.routes';

// Import repositories and services
import { ToolRepository } from './data/repositories/ToolRepository';
import { ProjectRepository } from './data/repositories/ProjectRepository';
import { ProcessRepository } from './data/repositories/ProcessRepository';

import { ToolService } from './data/services/ToolService';
import { ProjectService } from './data/services/ProjectService';
import { ProcessService } from './data/services/ProcessService';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3001;

// Initialize repositories
const toolRepository = new ToolRepository(prisma);
const projectRepository = new ProjectRepository(prisma);
const processRepository = new ProcessRepository(prisma);

// Initialize services
const toolService = new ToolService(toolRepository);
const projectService = new ProjectService(projectRepository);
const processService = new ProcessService(processRepository);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Authentication routes
app.use('/auth', authRoutes);

// Test log endpoint
app.get('/test-log', (req, res) => {
  console.log('Test log endpoint hit!');
  res.json({ ok: true });
});

console.log('Server file loaded!')

// Register the new tools router
app.use('/api/tools', toolsRoutes);

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectService.findAll();
    res.json(projects);
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Handle project creation with image upload
app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      tags: JSON.parse(req.body.tags), // Convert tags string to array
      imagePath: req.file ? req.file.filename : null,
      acquired: new Date(req.body.acquired) // Convert string to Date
    };
    
    const project = await projectService.create(projectData);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Handle project update with image upload
app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      tags: JSON.parse(req.body.tags), // Convert tags string to array
      imagePath: req.file ? req.file.filename : req.body.imagePath,
      acquired: new Date(req.body.acquired) // Convert string to Date
    };
    
    const project = await projectService.update(req.params.id, projectData);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await projectService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Processes endpoints
app.get('/api/processes', async (req, res) => {
  try {
    const filters = {
      category: req.query.category as ProcessCategory | undefined,
      status: req.query.status as string,
      search: req.query.search as string
    };
    const processes = await processService.findAll(filters);
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

app.get('/api/processes/:id', async (req, res) => {
  try {
    const process = await processService.findById(req.params.id);
    if (!process) {
      return res.status(404).json({ error: 'Process not found' });
    }
    res.json(process);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch process' });
  }
});

app.post('/api/processes', validate(processSchema), async (req, res) => {
  try {
    const process = await processService.create(req.body);
    res.status(201).json(process);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create process' });
  }
});

app.put('/api/processes/:id', validate(processSchema), async (req, res) => {
  try {
    const process = await processService.update(req.params.id, req.body);
    res.json(process);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update process' });
  }
});

app.delete('/api/processes/:id', async (req, res) => {
  try {
    await processService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete process' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

console.log('App is about to listen!')
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
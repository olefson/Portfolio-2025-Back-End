import { z } from 'zod';
import { ProcessCategory, ToolCategory, JobType, DegreeType } from '@prisma/client';

export const toolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.nativeEnum(ToolCategory),
  iconUrl: z.string().url('Invalid URL').optional(),
  link: z.string().url('Invalid URL').optional(),
  status: z.enum(['Plan to Try', 'Using', 'Archived'] as const),
  acquired: z.string().datetime('Invalid date format'),
  useCases: z.array(z.object({
    title: z.string().min(1, 'Use case title is required'),
    items: z.array(z.string().min(1, 'Use case item is required'))
  })).optional(),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  imagePath: z.string().optional(),
  githubUrl: z.string().refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Invalid URL'
  }).optional(),
  liveUrl: z.string().refine((val) => val === '' || z.string().url().safeParse(val).success, {
    message: 'Invalid URL'
  }).optional(),
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  toolsUsed: z.array(z.string().min(1)).optional(),
  date: z.string().refine((val) => {
    if (val === '') return true;
    // Accept YYYY-MM-DD format (HTML date input) or full datetime
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
    return dateRegex.test(val) || datetimeRegex.test(val) || z.string().datetime().safeParse(val).success;
  }, {
    message: 'Invalid date format. Expected YYYY-MM-DD or ISO datetime format'
  }).optional(),
});

// Schema for partial updates (PATCH-style) - all fields optional but validated if present
export const projectUpdateSchema = projectSchema.partial().refine((data) => {
  // If tags are provided, they must have at least one element
  if (data.tags !== undefined && data.tags.length === 0) {
    return false;
  }
  return true;
}, {
  message: 'If tags are provided, at least one tag is required',
  path: ['tags']
});

export const processSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  steps: z.array(z.string().min(1)).min(1, 'At least one step is required'),
  status: z.enum(['Active', 'Archived', 'Draft'] as const),
  category: z.nativeEnum(ProcessCategory),
  tools: z.array(z.string().min(1)).min(1, 'At least one tool is required'),
});

export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  company: z.string().min(1, 'Company is required').max(100),
  location: z.string().min(1, 'Location is required').max(100),
  type: z.nativeEnum(JobType),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
  description: z.string().min(1, 'Description is required').max(2000),
  responsibilities: z.array(z.string().min(1)).min(1, 'At least one responsibility is required'),
  technologies: z.array(z.string().min(1)).min(1, 'At least one technology is required'),
  achievements: z.array(z.string().min(1)).optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(100),
  degree: z.string().min(1, 'Degree is required').max(100),
  degreeType: z.nativeEnum(DegreeType),
  field: z.string().min(1, 'Field of study is required').max(100),
  location: z.string().min(1, 'Location is required').max(100),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional().nullable(),
  gpa: z.number().min(0).max(4).optional().nullable(),
  courses: z.array(z.string().min(1)).optional(),
});

export const diarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
  date: z.string().datetime('Invalid date format'),
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  mood: z.string().max(50).optional().nullable(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
}); 
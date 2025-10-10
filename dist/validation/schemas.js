"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.educationSchema = exports.jobSchema = exports.processSchema = exports.projectSchema = exports.toolSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.toolSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100),
    description: zod_1.z.string().min(1, 'Description is required').max(500),
    category: zod_1.z.nativeEnum(client_1.ToolCategory),
    iconUrl: zod_1.z.string().url('Invalid URL').optional(),
    link: zod_1.z.string().url('Invalid URL').optional(),
    status: zod_1.z.enum(['Plan to Try', 'Using', 'Archived']),
    acquired: zod_1.z.string().datetime('Invalid date format'),
    useCases: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().min(1, 'Use case title is required'),
        items: zod_1.z.array(zod_1.z.string().min(1, 'Use case item is required'))
    })).optional(),
});
exports.projectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100),
    description: zod_1.z.string().min(1, 'Description is required').max(1000),
    imagePath: zod_1.z.string().optional(),
    githubUrl: zod_1.z.string().refine((val) => val === '' || zod_1.z.string().url().safeParse(val).success, {
        message: 'Invalid URL'
    }).optional(),
    liveUrl: zod_1.z.string().refine((val) => val === '' || zod_1.z.string().url().safeParse(val).success, {
        message: 'Invalid URL'
    }).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one tag is required'),
    toolsUsed: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    date: zod_1.z.string().refine((val) => {
        if (val === '')
            return true;
        // Accept YYYY-MM-DD format (HTML date input) or full datetime
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
        return dateRegex.test(val) || datetimeRegex.test(val) || zod_1.z.string().datetime().safeParse(val).success;
    }, {
        message: 'Invalid date format. Expected YYYY-MM-DD or ISO datetime format'
    }).optional(),
});
exports.processSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100),
    description: zod_1.z.string().min(1, 'Description is required').max(1000),
    steps: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one step is required'),
    status: zod_1.z.enum(['Active', 'Archived', 'Draft']),
    category: zod_1.z.nativeEnum(client_1.ProcessCategory),
    tools: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one tool is required'),
});
exports.jobSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100),
    company: zod_1.z.string().min(1, 'Company is required').max(100),
    location: zod_1.z.string().min(1, 'Location is required').max(100),
    type: zod_1.z.nativeEnum(client_1.JobType),
    startDate: zod_1.z.string().datetime('Invalid start date'),
    endDate: zod_1.z.string().datetime('Invalid end date').optional(),
    description: zod_1.z.string().min(1, 'Description is required').max(2000),
    responsibilities: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one responsibility is required'),
    technologies: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one technology is required'),
    achievements: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    acquired: zod_1.z.string().datetime('Invalid date format'),
});
exports.educationSchema = zod_1.z.object({
    institution: zod_1.z.string().min(1, 'Institution is required').max(100),
    degree: zod_1.z.string().min(1, 'Degree is required').max(100),
    degreeType: zod_1.z.nativeEnum(client_1.DegreeType),
    field: zod_1.z.string().min(1, 'Field of study is required').max(100),
    location: zod_1.z.string().min(1, 'Location is required').max(100),
    startDate: zod_1.z.string().datetime('Invalid start date'),
    endDate: zod_1.z.string().datetime('Invalid end date').optional(),
    gpa: zod_1.z.number().min(0).max(4).optional(),
    honors: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    activities: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    courses: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    acquired: zod_1.z.string().datetime('Invalid date format'),
});

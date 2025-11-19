import { Tool, Project, Process, Job, Education, Diary } from '@prisma/client';

// Re-export Prisma types
export type { Tool, Project, Process, Job, Education, Diary };

// Additional types for request payloads
export type CreateToolDto = Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateToolDto = Partial<CreateToolDto>;

export type CreateProjectDto = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectDto = Partial<CreateProjectDto>;

export type CreateProcessDto = Omit<Process, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProcessDto = Partial<CreateProcessDto>;

export type CreateJobDto = Omit<Job, 'id' | 'updatedAt'>;
export type UpdateJobDto = Partial<CreateJobDto>;

export type CreateEducationDto = Omit<Education, 'id' | 'updatedAt'>;
export type UpdateEducationDto = Partial<CreateEducationDto>; 

export type CreateDiaryDto = Omit<Diary, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateDiaryDto = Partial<CreateDiaryDto>; 
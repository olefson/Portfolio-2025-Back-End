import { Tool, Project, Process } from '@prisma/client';

// Re-export Prisma types
export type { Tool, Project, Process };

// Additional types for request payloads
export type CreateToolDto = Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateToolDto = Partial<CreateToolDto>;

export type CreateProjectDto = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectDto = Partial<CreateProjectDto>;

export type CreateProcessDto = Omit<Process, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProcessDto = Partial<CreateProcessDto>; 
import { PrismaClient, Project } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateProjectDto, UpdateProjectDto } from '../types/models';

export class ProjectRepository extends BaseRepository<Project> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.project);
  }

  async create(data: CreateProjectDto): Promise<Project> {
    return super.create(data);
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return super.update(id, data);
  }

  async getToolsByIds(toolIds: string[]): Promise<{ id: string; name: string }[]> {
    return this.prisma.tool.findMany({
      where: { id: { in: toolIds } },
      select: { id: true, name: true }
    });
  }
} 
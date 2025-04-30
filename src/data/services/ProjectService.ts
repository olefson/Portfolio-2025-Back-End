import { Project } from '@prisma/client';
import { BaseService } from './BaseService';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { CreateProjectDto, UpdateProjectDto } from '../types/models';

export class ProjectService extends BaseService<Project> {
  constructor(repository: ProjectRepository) {
    super(repository);
  }

  async create(data: CreateProjectDto): Promise<Project> {
    return super.create(data);
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return super.update(id, data);
  }
} 
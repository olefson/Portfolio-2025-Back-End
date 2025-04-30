import { Tool } from '@prisma/client';
import { BaseService } from './BaseService';
import { ToolRepository } from '../repositories/ToolRepository';
import { CreateToolDto, UpdateToolDto } from '../types/models';
import { ToolFilters } from '../types/filters';

export class ToolService extends BaseService<Tool> {
  protected repository: ToolRepository;

  constructor(repository: ToolRepository) {
    super(repository);
    this.repository = repository;
  }

  async findAll(filters?: ToolFilters): Promise<Tool[]> {
    return this.repository.findAll(filters);
  }

  async create(data: CreateToolDto): Promise<Tool> {
    return super.create(data);
  }

  async update(id: string, data: UpdateToolDto): Promise<Tool> {
    return super.update(id, data);
  }
} 
import { Process } from '@prisma/client';
import { BaseService } from './BaseService';
import { ProcessRepository } from '../repositories/ProcessRepository';
import { CreateProcessDto, UpdateProcessDto } from '../types/models';
import { ProcessFilters } from '../types/filters';

export class ProcessService extends BaseService<Process> {
  protected repository: ProcessRepository;

  constructor(repository: ProcessRepository) {
    super(repository);
    this.repository = repository;
  }

  async findAll(filters?: ProcessFilters): Promise<Process[]> {
    return this.repository.findAll(filters);
  }

  async create(data: CreateProcessDto): Promise<Process> {
    console.log('ProcessService.create called with data:', data);
    const result = await super.create(data);
    console.log('ProcessService.create result:', result);
    return result;
  }

  async update(id: string, data: UpdateProcessDto): Promise<Process> {
    return super.update(id, data);
  }
} 
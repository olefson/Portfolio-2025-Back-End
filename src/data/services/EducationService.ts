import { Education } from '@prisma/client';
import { BaseService } from './BaseService';
import { EducationRepository } from '../repositories/EducationRepository';
import { CreateEducationDto, UpdateEducationDto } from '../types/models';

export class EducationService extends BaseService<Education> {
  protected repository: EducationRepository;

  constructor(repository: EducationRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Find all education records in chronological order (most recent first)
   */
  async findAll(): Promise<Education[]> {
    return this.repository.findAll();
  }

  async create(data: CreateEducationDto): Promise<Education> {
    return super.create(data);
  }

  async update(id: string, data: UpdateEducationDto): Promise<Education> {
    return super.update(id, data);
  }
}






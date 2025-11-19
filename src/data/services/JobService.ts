import { Job } from '@prisma/client';
import { BaseService } from './BaseService';
import { JobRepository } from '../repositories/JobRepository';
import { CreateJobDto, UpdateJobDto } from '../types/models';

export class JobService extends BaseService<Job> {
  protected repository: JobRepository;

  constructor(repository: JobRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Find all jobs in chronological order (most recent first)
   */
  async findAll(): Promise<Job[]> {
    return this.repository.findAll();
  }

  async create(data: CreateJobDto): Promise<Job> {
    return super.create(data);
  }

  async update(id: string, data: UpdateJobDto): Promise<Job> {
    return super.update(id, data);
  }
}




import { PrismaClient, Job } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateJobDto, UpdateJobDto } from '../types/models';

export class JobRepository extends BaseRepository<Job> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.job);
  }

  /**
   * Find all jobs, ordered by startDate descending (most recent first)
   * This is important for displaying jobs chronologically
   */
  async findAll(): Promise<Job[]> {
    return this.prisma.job.findMany({
      orderBy: { startDate: 'desc' }
    });
  }

  async create(data: CreateJobDto): Promise<Job> {
    return super.create(data);
  }

  async update(id: string, data: UpdateJobDto): Promise<Job> {
    return super.update(id, data);
  }
}


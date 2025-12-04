import { PrismaClient, Education } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateEducationDto, UpdateEducationDto } from '../types/models';

export class EducationRepository extends BaseRepository<Education> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.education);
  }

  /**
   * Find all education records, ordered by startDate descending (most recent first)
   * This is important for displaying education chronologically
   */
  async findAll(): Promise<Education[]> {
    return this.prisma.education.findMany({
      orderBy: { startDate: 'desc' }
    });
  }

  async create(data: CreateEducationDto): Promise<Education> {
    return super.create(data);
  }

  async update(id: string, data: UpdateEducationDto): Promise<Education> {
    return super.update(id, data);
  }
}






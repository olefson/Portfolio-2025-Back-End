import { PrismaClient, Process } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateProcessDto, UpdateProcessDto } from '../types/models';
import { ProcessFilters } from '../types/filters';

export class ProcessRepository extends BaseRepository<Process> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.process);
  }

  async findAll(filters?: ProcessFilters): Promise<Process[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.process.findMany({
      where,
      orderBy: { title: 'asc' }
    });
  }

  async create(data: CreateProcessDto): Promise<Process> {
    return super.create(data);
  }

  async update(id: string, data: UpdateProcessDto): Promise<Process> {
    return super.update(id, data);
  }
} 
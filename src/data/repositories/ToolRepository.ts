import { PrismaClient, Tool } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateToolDto, UpdateToolDto } from '../types/models';
import { ToolFilters } from '../types/filters';

export class ToolRepository extends BaseRepository<Tool> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.tool);
  }

  async findAll(filters?: ToolFilters): Promise<Tool[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.tool.findMany({
      where,
      orderBy: { acquired: 'desc' }
    });
  }

  async create(data: CreateToolDto): Promise<Tool> {
    return super.create(data);
  }

  async update(id: string, data: UpdateToolDto): Promise<Tool> {
    return super.update(id, data);
  }
} 
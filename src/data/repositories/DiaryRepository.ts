import { PrismaClient, Diary } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { CreateDiaryDto, UpdateDiaryDto } from '../types/models';

export class DiaryRepository extends BaseRepository<Diary> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.diary);
  }

  /**
   * Find all diary entries, ordered by date descending (most recent first)
   */
  async findAll(): Promise<Diary[]> {
    return this.prisma.diary.findMany({
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Find diary entries by tags (using PostgreSQL array overlap operator)
   * Returns entries that have at least one matching tag
   */
  async findByTags(tags: string[]): Promise<Diary[]> {
    if (tags.length === 0) {
      return [];
    }
    
    // Use Prisma's array overlap with raw SQL for PostgreSQL
    // The && operator checks if arrays have any elements in common
    return this.prisma.$queryRaw<Diary[]>`
      SELECT * FROM "Diary"
      WHERE tags && ${tags}::text[]
      ORDER BY date DESC
    `;
  }

  /**
   * Find recent diary entries (for personality context in chatbot)
   */
  async findRecent(limit: number = 3): Promise<Diary[]> {
    return this.prisma.diary.findMany({
      orderBy: { date: 'desc' },
      take: limit
    });
  }

  async create(data: CreateDiaryDto): Promise<Diary> {
    return super.create(data);
  }

  async update(id: string, data: UpdateDiaryDto): Promise<Diary> {
    return super.update(id, data);
  }
}


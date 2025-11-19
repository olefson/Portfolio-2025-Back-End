import { Diary } from '@prisma/client';
import { BaseService } from './BaseService';
import { DiaryRepository } from '../repositories/DiaryRepository';
import { CreateDiaryDto, UpdateDiaryDto } from '../types/models';

export class DiaryService extends BaseService<Diary> {
  protected repository: DiaryRepository;

  constructor(repository: DiaryRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Find all diary entries in chronological order (most recent first)
   */
  async findAll(): Promise<Diary[]> {
    return this.repository.findAll();
  }

  /**
   * Find diary entries by tags (for chatbot context building)
   */
  async findByTags(tags: string[]): Promise<Diary[]> {
    return this.repository.findByTags(tags);
  }

  /**
   * Find recent diary entries (for personality context)
   */
  async findRecent(limit: number = 3): Promise<Diary[]> {
    return this.repository.findRecent(limit);
  }

  async create(data: CreateDiaryDto): Promise<Diary> {
    return super.create(data);
  }

  async update(id: string, data: UpdateDiaryDto): Promise<Diary> {
    return super.update(id, data);
  }
}


import { BaseRepository } from '../repositories/BaseRepository';

export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  async findAll(): Promise<T[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  async create(data: any): Promise<T> {
    return this.repository.create(data);
  }

  async update(id: string, data: any): Promise<T> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
} 
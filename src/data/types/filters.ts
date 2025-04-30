import { ProcessCategory, ToolCategory } from '@prisma/client';

export interface BaseFilters {
  status?: string;
  search?: string;
}

export interface ProcessFilters extends BaseFilters {
  category?: ProcessCategory;
}

export interface ToolFilters extends BaseFilters {
  category?: ToolCategory;
} 
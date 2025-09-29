import { Project, Tool } from '@prisma/client';
import { BaseService } from './BaseService';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { CreateProjectDto, UpdateProjectDto } from '../types/models';

export class ProjectService extends BaseService<Project> {
  private projectRepository: ProjectRepository;

  constructor(repository: ProjectRepository) {
    super(repository);
    this.projectRepository = repository;
  }

  async create(data: CreateProjectDto): Promise<Project> {
    return super.create(data);
  }

  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    return super.update(id, data);
  }

  // Override findAll to include tool names
  async findAll(): Promise<any[]> {
    const projects = await super.findAll();
    return this.enrichWithToolNames(projects);
  }

  // Override findById to include tool names
  async findById(id: string): Promise<any | null> {
    const project = await super.findById(id);
    if (!project) return null;
    const enrichedProjects = await this.enrichWithToolNames([project]);
    return enrichedProjects[0];
  }

  private async enrichWithToolNames(projects: Project[]): Promise<any[]> {
    // Get all unique tool IDs from all projects
    const allToolIds = [...new Set(projects.flatMap(p => p.toolsUsed))];
    
    if (allToolIds.length === 0) {
      return projects.map(project => ({
        ...project,
        toolNames: []
      }));
    }
    
    // Fetch all tools by their IDs using the repository method
    const tools = await this.projectRepository.getToolsByIds(allToolIds);
    
    // Create a map of tool ID to tool name
    const toolMap = new Map(tools.map((tool: { id: string; name: string }) => [tool.id, tool.name]));
    
    // Enrich projects with tool names
    return projects.map(project => ({
      ...project,
      toolNames: project.toolsUsed.map(toolId => toolMap.get(toolId) || toolId)
    }));
  }
} 
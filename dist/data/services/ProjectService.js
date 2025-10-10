"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const BaseService_1 = require("./BaseService");
class ProjectService extends BaseService_1.BaseService {
    constructor(repository) {
        super(repository);
        this.projectRepository = repository;
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
    // Override findAll to include tool names
    async findAll() {
        const projects = await super.findAll();
        return this.enrichWithToolNames(projects);
    }
    // Override findById to include tool names
    async findById(id) {
        const project = await super.findById(id);
        if (!project)
            return null;
        const enrichedProjects = await this.enrichWithToolNames([project]);
        return enrichedProjects[0];
    }
    async enrichWithToolNames(projects) {
        // Get all unique tool IDs from all projects
        const allToolIds = [...new Set(projects.flatMap(p => p.toolsUsed))];
        if (allToolIds.length === 0) {
            return projects.map(project => (Object.assign(Object.assign({}, project), { toolNames: [] })));
        }
        // Fetch all tools by their IDs using the repository method
        const tools = await this.projectRepository.getToolsByIds(allToolIds);
        // Create a map of tool ID to tool name
        const toolMap = new Map(tools.map((tool) => [tool.id, tool.name]));
        // Enrich projects with tool names
        return projects.map(project => (Object.assign(Object.assign({}, project), { toolNames: project.toolsUsed.map(toolId => toolMap.get(toolId) || toolId) })));
    }
}
exports.ProjectService = ProjectService;

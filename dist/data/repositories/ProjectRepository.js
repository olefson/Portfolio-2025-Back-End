"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ProjectRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.project);
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
    async getToolsByIds(toolIds) {
        return this.prisma.tool.findMany({
            where: { id: { in: toolIds } },
            select: { id: true, name: true }
        });
    }
}
exports.ProjectRepository = ProjectRepository;

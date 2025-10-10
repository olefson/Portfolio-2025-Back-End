"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ToolRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.tool);
    }
    async findAll(filters) {
        const where = {};
        if (filters === null || filters === void 0 ? void 0 : filters.category) {
            where.category = filters.category;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.status) {
            where.status = filters.status;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        return this.prisma.tool.findMany({
            where,
        });
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.ToolRepository = ToolRepository;

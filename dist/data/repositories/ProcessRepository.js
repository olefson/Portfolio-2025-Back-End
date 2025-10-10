"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ProcessRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.process);
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
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } }
            ];
        }
        return this.prisma.process.findMany({
            where,
            orderBy: { title: 'asc' }
        });
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.ProcessRepository = ProcessRepository;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class JobRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.job);
    }
    /**
     * Find all jobs, ordered by startDate descending (most recent first)
     * This is important for displaying jobs chronologically
     */
    async findAll() {
        return this.prisma.job.findMany({
            orderBy: { startDate: 'desc' }
        });
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.JobRepository = JobRepository;

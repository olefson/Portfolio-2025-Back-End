"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class EducationRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.education);
    }
    /**
     * Find all education records, ordered by startDate descending (most recent first)
     * This is important for displaying education chronologically
     */
    async findAll() {
        return this.prisma.education.findMany({
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
exports.EducationRepository = EducationRepository;

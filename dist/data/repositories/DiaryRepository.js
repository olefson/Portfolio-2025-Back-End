"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class DiaryRepository extends BaseRepository_1.BaseRepository {
    constructor(prisma) {
        super(prisma, prisma.diary);
    }
    /**
     * Find all diary entries, ordered by date descending (most recent first)
     */
    async findAll() {
        return this.prisma.diary.findMany({
            orderBy: { date: 'desc' }
        });
    }
    /**
     * Find diary entries by tags (using PostgreSQL array overlap operator)
     * Returns entries that have at least one matching tag
     */
    async findByTags(tags) {
        if (tags.length === 0) {
            return [];
        }
        // Use Prisma's array overlap with raw SQL for PostgreSQL
        // The && operator checks if arrays have any elements in common
        return this.prisma.$queryRaw `
      SELECT * FROM "Diary"
      WHERE tags && ${tags}::text[]
      ORDER BY date DESC
    `;
    }
    /**
     * Find recent diary entries (for personality context in chatbot)
     */
    async findRecent(limit = 3) {
        return this.prisma.diary.findMany({
            orderBy: { date: 'desc' },
            take: limit
        });
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.DiaryRepository = DiaryRepository;

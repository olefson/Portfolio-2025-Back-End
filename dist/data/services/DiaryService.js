"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryService = void 0;
const BaseService_1 = require("./BaseService");
class DiaryService extends BaseService_1.BaseService {
    constructor(repository) {
        super(repository);
        this.repository = repository;
    }
    /**
     * Find all diary entries in chronological order (most recent first)
     */
    async findAll() {
        return this.repository.findAll();
    }
    /**
     * Find diary entries by tags (for chatbot context building)
     */
    async findByTags(tags) {
        return this.repository.findByTags(tags);
    }
    /**
     * Find recent diary entries (for personality context)
     */
    async findRecent(limit = 3) {
        return this.repository.findRecent(limit);
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.DiaryService = DiaryService;

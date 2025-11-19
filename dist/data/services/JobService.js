"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const BaseService_1 = require("./BaseService");
class JobService extends BaseService_1.BaseService {
    constructor(repository) {
        super(repository);
        this.repository = repository;
    }
    /**
     * Find all jobs in chronological order (most recent first)
     */
    async findAll() {
        return this.repository.findAll();
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.JobService = JobService;

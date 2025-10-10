"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessService = void 0;
const BaseService_1 = require("./BaseService");
class ProcessService extends BaseService_1.BaseService {
    constructor(repository) {
        super(repository);
        this.repository = repository;
    }
    async findAll(filters) {
        return this.repository.findAll(filters);
    }
    async create(data) {
        console.log('ProcessService.create called with data:', data);
        const result = await super.create(data);
        console.log('ProcessService.create result:', result);
        return result;
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.ProcessService = ProcessService;

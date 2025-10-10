"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = void 0;
const BaseService_1 = require("./BaseService");
class ToolService extends BaseService_1.BaseService {
    constructor(repository) {
        super(repository);
        this.repository = repository;
    }
    async findAll(filters) {
        return this.repository.findAll(filters);
    }
    async create(data) {
        return super.create(data);
    }
    async update(id, data) {
        return super.update(id, data);
    }
}
exports.ToolService = ToolService;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    constructor(prisma, model) {
        this.prisma = prisma;
        this.model = model;
    }
    async findAll() {
        return this.model.findMany();
    }
    async findById(id) {
        return this.model.findUnique({
            where: { id }
        });
    }
    async create(data) {
        console.log('BaseRepository.create called with data:', data);
        const result = await this.model.create({
            data
        });
        console.log('BaseRepository.create result:', result);
        return result;
    }
    async update(id, data) {
        return this.model.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        await this.model.delete({
            where: { id }
        });
    }
}
exports.BaseRepository = BaseRepository;

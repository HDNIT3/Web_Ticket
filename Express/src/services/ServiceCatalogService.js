const mongoose = require('mongoose');
const Service = require('../models/service');

const ServiceCatalogService = {
    buildFilter: (query = {}) => {
        const filter = {};

        if (query.q) {
            const keyword = `${query.q}`.trim();
            if (keyword) {
                filter.$or = [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { category: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        if (query.category) {
            filter.category = { $regex: `${query.category}`.trim(), $options: 'i' };
        }

        if (typeof query.isActive !== 'undefined') {
            filter.isActive = query.isActive === true || query.isActive === 'true' || query.isActive === 1 || query.isActive === '1';
        }

        if (query.activeOnly === 'true') {
            filter.isActive = true;
        }

        return filter;
    },

    getServices: async (query = {}) => {
        const filter = ServiceCatalogService.buildFilter(query);
        const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
        const sizeParam = typeof query.limit !== 'undefined' ? query.limit : query.size;
        const limit = Math.min(Math.max(Number.parseInt(sizeParam, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Service.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Service.countDocuments(filter),
        ]);

        return {
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(Math.ceil(total / limit), 1),
            },
        };
    },

    getServiceById: async (serviceId) => {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            const error = new Error('ID dịch vụ không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        const service = await Service.findById(serviceId).lean();
        if (!service) {
            const error = new Error('Không tìm thấy dịch vụ.');
            error.statusCode = 404;
            throw error;
        }

        return service;
    },

    createService: async (dto) => {
        const duplicate = await Service.findOne({ name: dto.name });
        if (duplicate) {
            const error = new Error('Tên dịch vụ đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }

        const created = await Service.create({
            name: dto.name,
            imageUrl: dto.imageUrl || undefined,
            unitPrice: dto.unitPrice,
            description: dto.description || undefined,
            category: dto.category,
            isActive: dto.isActive,
        });

        return ServiceCatalogService.getServiceById(created._id);
    },

    updateService: async (serviceId, dto) => {
        const service = await Service.findById(serviceId);
        if (!service) {
            const error = new Error('Không tìm thấy dịch vụ.');
            error.statusCode = 404;
            throw error;
        }

        if (typeof dto.name !== 'undefined' && dto.name !== service.name) {
            const duplicate = await Service.findOne({ name: dto.name, _id: { $ne: service._id } });
            if (duplicate) {
                const error = new Error('Tên dịch vụ đã tồn tại.');
                error.statusCode = 409;
                throw error;
            }
            service.name = dto.name;
        }

        if (typeof dto.imageUrl !== 'undefined') service.imageUrl = dto.imageUrl || undefined;
        if (typeof dto.unitPrice !== 'undefined') service.unitPrice = dto.unitPrice;
        if (typeof dto.description !== 'undefined') service.description = dto.description || undefined;
        if (typeof dto.category !== 'undefined') service.category = dto.category;
        if (typeof dto.isActive !== 'undefined') service.isActive = dto.isActive;

        await service.save();
        return ServiceCatalogService.getServiceById(service._id);
    },

    deleteService: async (serviceId) => {
        const service = await ServiceCatalogService.getServiceById(serviceId);
        await Service.deleteOne({ _id: service._id });
        return service;
    },
};

module.exports = ServiceCatalogService;


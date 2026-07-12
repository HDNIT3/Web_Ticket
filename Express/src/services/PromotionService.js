const mongoose = require('mongoose');
const Promotion = require('../models/promotion');

const VALID_DISCOUNT_TYPES = ['PERCENT', 'AMOUNT'];

const PromotionService = {
    buildFilter: (query = {}) => {
        const filter = {};

        if (query.q) {
            const keyword = `${query.q}`.trim();
            if (keyword) {
                filter.$or = [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { code: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        if (query.code) {
            filter.code = `${query.code}`.trim().toUpperCase();
        }

        if (query.discountType) {
            const discountType = `${query.discountType}`.trim().toUpperCase();
            if (!VALID_DISCOUNT_TYPES.includes(discountType)) {
                const error = new Error('discountType không hợp lệ.');
                error.statusCode = 400;
                throw error;
            }
            filter.discountType = discountType;
        }

        if (typeof query.isActive !== 'undefined') {
            filter.isActive = query.isActive === true || query.isActive === 'true' || query.isActive === 1 || query.isActive === '1';
        }

        if (query.activeOnly === 'true') {
            filter.isActive = true;
        }

        return filter;
    },

    getPromotions: async (query = {}) => {
        const filter = PromotionService.buildFilter(query);
        const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
        const sizeParam = typeof query.limit !== 'undefined' ? query.limit : query.size;
        const limit = Math.min(Math.max(Number.parseInt(sizeParam, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Promotion.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Promotion.countDocuments(filter),
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

    getPromotionById: async (promotionId) => {
        if (!mongoose.Types.ObjectId.isValid(promotionId)) {
            const error = new Error('ID khuyến mãi không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        const promotion = await Promotion.findById(promotionId).lean();
        if (!promotion) {
            const error = new Error('Không tìm thấy khuyến mãi.');
            error.statusCode = 404;
            throw error;
        }

        return promotion;
    },

    validatePromotionBusinessRules: (promotion) => {
        if (!VALID_DISCOUNT_TYPES.includes(promotion.discountType)) {
            const error = new Error('discountType không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        if (promotion.discountType === 'PERCENT' && promotion.discountValue > 100) {
            const error = new Error('Khuyến mãi phần trăm không được vượt quá 100.');
            error.statusCode = 400;
            throw error;
        }

        if (promotion.startDate && promotion.endDate && promotion.endDate < promotion.startDate) {
            const error = new Error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
            error.statusCode = 400;
            throw error;
        }
    },

    createPromotion: async (dto) => {
        const duplicate = await Promotion.findOne({ code: dto.code });
        if (duplicate) {
            const error = new Error('Mã khuyến mãi đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }

        const payload = {
            name: dto.name,
            description: dto.description || undefined,
            discountType: dto.discountType,
            discountValue: dto.discountValue,
            maxDiscountAmount: typeof dto.maxDiscountAmount === 'undefined' ? undefined : dto.maxDiscountAmount,
            minTicketRequired: typeof dto.minTicketRequired === 'undefined' ? 0 : dto.minTicketRequired,
            minOrderValue: typeof dto.minOrderValue === 'undefined' ? 0 : dto.minOrderValue,
            startDate: dto.startDate,
            endDate: dto.endDate,
            code: dto.code,
            quantity: dto.quantity,
            isActive: dto.isActive,
            imageUrl: dto.imageUrl || undefined,
        };

        PromotionService.validatePromotionBusinessRules(payload);

        const created = await Promotion.create(payload);

        return PromotionService.getPromotionById(created._id);
    },

    updatePromotion: async (promotionId, dto) => {
        const promotion = await Promotion.findById(promotionId);
        if (!promotion) {
            const error = new Error('Không tìm thấy khuyến mãi.');
            error.statusCode = 404;
            throw error;
        }

        if (typeof dto.code !== 'undefined' && dto.code !== promotion.code) {
            const duplicate = await Promotion.findOne({ code: dto.code, _id: { $ne: promotion._id } });
            if (duplicate) {
                const error = new Error('Mã khuyến mãi đã tồn tại.');
                error.statusCode = 409;
                throw error;
            }
            promotion.code = dto.code;
        }

        if (typeof dto.name !== 'undefined') promotion.name = dto.name;
        if (typeof dto.description !== 'undefined') promotion.description = dto.description || undefined;
        if (typeof dto.discountType !== 'undefined') promotion.discountType = dto.discountType;
        if (typeof dto.discountValue !== 'undefined') promotion.discountValue = dto.discountValue;
        if (typeof dto.maxDiscountAmount !== 'undefined') promotion.maxDiscountAmount = dto.maxDiscountAmount;
        if (typeof dto.minTicketRequired !== 'undefined') promotion.minTicketRequired = dto.minTicketRequired;
        if (typeof dto.minOrderValue !== 'undefined') promotion.minOrderValue = dto.minOrderValue;
        if (typeof dto.startDate !== 'undefined') promotion.startDate = dto.startDate;
        if (typeof dto.endDate !== 'undefined') promotion.endDate = dto.endDate;
        if (typeof dto.quantity !== 'undefined') promotion.quantity = dto.quantity;
        if (typeof dto.isActive !== 'undefined') promotion.isActive = dto.isActive;
        if (typeof dto.imageUrl !== 'undefined') promotion.imageUrl = dto.imageUrl || undefined;

        PromotionService.validatePromotionBusinessRules(promotion);
        await promotion.save();
        return PromotionService.getPromotionById(promotion._id);
    },

    deletePromotion: async (promotionId) => {
        const promotion = await PromotionService.getPromotionById(promotionId);
        await Promotion.deleteOne({ _id: promotion._id });
        return promotion;
    },
};

module.exports = PromotionService;


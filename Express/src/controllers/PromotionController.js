const PromotionService = require('../services/PromotionService');
const PromotionResponseDto = require('../dtos/response/PromotionResponseDto');
const Booking = require('../models/booking');
const Ticket = require('../models/ticket');
const Promotion = require('../models/promotion');

const PromotionController = {
    getPromotions: async (req, res) => {
        try {
            const data = await PromotionService.getPromotions(req.query);
            return res.status(200).json(PromotionResponseDto.ok(data, 'Lấy danh sách khuyến mãi thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                PromotionResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    getPromotionById: async (req, res) => {
        try {
            const data = await PromotionService.getPromotionById(req.params.id);
            return res.status(200).json(PromotionResponseDto.ok(data, 'Lấy khuyến mãi thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                PromotionResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    createPromotion: async (req, res) => {
        try {
            const data = await PromotionService.createPromotion(req.dto);
            return res.status(201).json(PromotionResponseDto.ok(data, 'Tạo khuyến mãi thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                PromotionResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    updatePromotion: async (req, res) => {
        try {
            const data = await PromotionService.updatePromotion(req.params.id, req.dto);
            return res.status(200).json(PromotionResponseDto.ok(data, 'Cập nhật khuyến mãi thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                PromotionResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    deletePromotion: async (req, res) => {
        try {
            await PromotionService.deletePromotion(req.params.id);
            return res.status(200).json(PromotionResponseDto.ok(null, 'Xóa khuyến mãi thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                PromotionResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    validatePromoCode: async (req, res) => {
        try {
            const { code, totalAmount, ticketCount } = req.body;
            const userId = req.user.id;

            if (!code) {
                return res.status(400).json(PromotionResponseDto.fail('Mã khuyến mãi không được trống.'));
            }

            const promotion = await Promotion.findOne({ code: code.toUpperCase(), isActive: true });
            if (!promotion) {
                return res.status(404).json(PromotionResponseDto.fail('Mã khuyến mãi không tồn tại hoặc đã ngừng hoạt động.'));
            }

            // Kiểm tra hạn sử dụng
            const now = new Date();
            if (now < new Date(promotion.startDate) || now > new Date(promotion.endDate)) {
                return res.status(400).json(PromotionResponseDto.fail('Mã khuyến mãi đã hết hạn hoặc chưa đến thời gian áp dụng.'));
            }

            // Kiểm tra số lượng
            if (promotion.quantity <= 0) {
                return res.status(400).json(PromotionResponseDto.fail('Mã khuyến mãi đã hết lượt sử dụng.'));
            }

            // Kiểm tra điều kiện đơn hàng tối thiểu
            if (totalAmount && totalAmount < promotion.minOrderValue) {
                return res.status(400).json(PromotionResponseDto.fail(`Đơn hàng tối thiểu phải đạt ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này.`));
            }

            // Kiểm tra số lượng vé tối thiểu
            if (ticketCount && ticketCount < promotion.minTicketRequired) {
                return res.status(400).json(PromotionResponseDto.fail(`Cần mua tối thiểu ${promotion.minTicketRequired} vé để áp dụng mã này.`));
            }

            // Kiểm tra xem user đã dùng mã này chưa (giới hạn 1 lần)
            const usedBookings = await Booking.find({ user: userId, status: 'PAID' }).distinct('_id');
            const usedTicket = await Ticket.findOne({
                booking: { $in: usedBookings },
                'promotion.promotionId': promotion._id
            });
            if (usedTicket) {
                return res.status(400).json(PromotionResponseDto.fail('Tài khoản của bạn đã sử dụng mã khuyến mãi này rồi.'));
            }

            // Tính tiền giảm giá
            let discountAmount = 0;
            if (promotion.discountType === 'PERCENT') {
                discountAmount = (totalAmount * promotion.discountValue) / 100;
                if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
                    discountAmount = promotion.maxDiscountAmount;
                }
            } else {
                discountAmount = promotion.discountValue;
            }

            if (discountAmount > totalAmount) {
                discountAmount = totalAmount;
            }

            return res.status(200).json(PromotionResponseDto.ok({
                promotionId: promotion._id,
                code: promotion.code,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                discountAmount
            }, 'Mã khuyến mãi hợp lệ!'));
        } catch (error) {
            return res.status(500).json(PromotionResponseDto.fail(error.message));
        }
    }
};

module.exports = PromotionController;


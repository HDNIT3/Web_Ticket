const VALID_DISCOUNT_TYPES = ['PERCENT', 'AMOUNT'];

const toNumber = (value) => {
    if (value === null || typeof value === 'undefined' || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const toDate = (value) => {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date('invalid') : parsed;
};

class CreatePromotionRequestDto {
    constructor(body = {}) {
        this.name = typeof body.name === 'string' ? body.name.trim() : '';
        this.description = typeof body.description === 'string' ? body.description.trim() : '';
        this.discountType = typeof body.discountType === 'string' ? body.discountType.trim().toUpperCase() : '';
        this.discountValue = toNumber(body.discountValue);
        this.maxDiscountAmount = toNumber(body.maxDiscountAmount);
        this.minTicketRequired = toNumber(body.minTicketRequired);
        this.minOrderValue = toNumber(body.minOrderValue);
        this.startDate = toDate(body.startDate);
        this.endDate = toDate(body.endDate);
        this.code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
        this.quantity = toNumber(body.quantity);
        this.isActive = typeof body.isActive === 'undefined'
            ? undefined
            : body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
        this.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
    }

    validate() {
        const errors = [];

        if (!this.name) {
            errors.push({ field: 'name', message: 'Tên khuyến mãi là bắt buộc.' });
        } else if (this.name.length > 255) {
            errors.push({ field: 'name', message: 'Tên khuyến mãi không được vượt quá 255 ký tự.' });
        }

        if (this.description && this.description.length > 1000) {
            errors.push({ field: 'description', message: 'Mô tả không được vượt quá 1000 ký tự.' });
        }

        if (!VALID_DISCOUNT_TYPES.includes(this.discountType)) {
            errors.push({ field: 'discountType', message: 'discountType phải là PERCENT hoặc AMOUNT.' });
        }

        if (typeof this.discountValue === 'undefined') {
            errors.push({ field: 'discountValue', message: 'Giá trị giảm giá là bắt buộc.' });
        } else if (!Number.isFinite(this.discountValue)) {
            errors.push({ field: 'discountValue', message: 'Giá trị giảm giá phải là một số hợp lệ.' });
        } else if (this.discountValue < 0) {
            errors.push({ field: 'discountValue', message: 'Giá trị giảm giá không được nhỏ hơn 0.' });
        } else if (this.discountType === 'PERCENT' && this.discountValue > 100) {
            errors.push({ field: 'discountValue', message: 'Khuyến mãi phần trăm không được vượt quá 100.' });
        }

        if (typeof this.maxDiscountAmount !== 'undefined' && (!Number.isFinite(this.maxDiscountAmount) || this.maxDiscountAmount < 0)) {
            errors.push({ field: 'maxDiscountAmount', message: 'Giới hạn giảm giá tối đa phải là số không âm.' });
        }

        if (typeof this.minTicketRequired !== 'undefined') {
            if (!Number.isFinite(this.minTicketRequired)) {
                errors.push({ field: 'minTicketRequired', message: 'Số vé tối thiểu phải là một số hợp lệ.' });
            } else if (this.minTicketRequired < 0) {
                errors.push({ field: 'minTicketRequired', message: 'Số vé tối thiểu không được nhỏ hơn 0.' });
            }
        }

        if (typeof this.minOrderValue !== 'undefined') {
            if (!Number.isFinite(this.minOrderValue)) {
                errors.push({ field: 'minOrderValue', message: 'Giá trị đơn hàng tối thiểu phải là một số hợp lệ.' });
            } else if (this.minOrderValue < 0) {
                errors.push({ field: 'minOrderValue', message: 'Giá trị đơn hàng tối thiểu không được nhỏ hơn 0.' });
            }
        }

        if (typeof this.startDate === 'undefined') {
            errors.push({ field: 'startDate', message: 'Ngày bắt đầu là bắt buộc.' });
        } else if (Number.isNaN(this.startDate.getTime())) {
            errors.push({ field: 'startDate', message: 'Ngày bắt đầu không hợp lệ.' });
        }

        if (typeof this.endDate === 'undefined') {
            errors.push({ field: 'endDate', message: 'Ngày kết thúc là bắt buộc.' });
        } else if (Number.isNaN(this.endDate.getTime())) {
            errors.push({ field: 'endDate', message: 'Ngày kết thúc không hợp lệ.' });
        }

        if (this.startDate && this.endDate && !Number.isNaN(this.startDate.getTime()) && !Number.isNaN(this.endDate.getTime()) && this.endDate < this.startDate) {
            errors.push({ field: 'endDate', message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' });
        }

        if (!this.code) {
            errors.push({ field: 'code', message: 'Mã khuyến mãi là bắt buộc.' });
        } else if (this.code.length > 100) {
            errors.push({ field: 'code', message: 'Mã khuyến mãi không được vượt quá 100 ký tự.' });
        }

        if (typeof this.quantity === 'undefined') {
            errors.push({ field: 'quantity', message: 'Số lượng là bắt buộc.' });
        } else if (!Number.isFinite(this.quantity)) {
            errors.push({ field: 'quantity', message: 'Số lượng phải là một số hợp lệ.' });
        } else if (this.quantity < 0) {
            errors.push({ field: 'quantity', message: 'Số lượng không được nhỏ hơn 0.' });
        }

        if (this.imageUrl && this.imageUrl.length > 500) {
            errors.push({ field: 'imageUrl', message: 'Image URL không được vượt quá 500 ký tự.' });
        }

        return errors;
    }
}

module.exports = CreatePromotionRequestDto;


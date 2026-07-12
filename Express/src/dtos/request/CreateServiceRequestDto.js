const toNumber = (value) => {
    if (value === null || typeof value === 'undefined' || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

class CreateServiceRequestDto {
    constructor(body = {}) {
        this.name = typeof body.name === 'string' ? body.name.trim() : '';
        this.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
        this.unitPrice = toNumber(body.unitPrice);
        this.description = typeof body.description === 'string' ? body.description.trim() : '';
        this.category = typeof body.category === 'string' ? body.category.trim() : '';
        this.isActive = typeof body.isActive === 'undefined'
            ? undefined
            : body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
    }

    validate() {
        const errors = [];

        if (!this.name) {
            errors.push({ field: 'name', message: 'Tên dịch vụ là bắt buộc.' });
        } else if (this.name.length > 255) {
            errors.push({ field: 'name', message: 'Tên dịch vụ không được vượt quá 255 ký tự.' });
        }

        if (this.imageUrl && this.imageUrl.length > 500) {
            errors.push({ field: 'imageUrl', message: 'Image URL không được vượt quá 500 ký tự.' });
        }

        if (typeof this.unitPrice === 'undefined') {
            errors.push({ field: 'unitPrice', message: 'Đơn giá là bắt buộc.' });
        } else if (!Number.isFinite(this.unitPrice)) {
            errors.push({ field: 'unitPrice', message: 'Đơn giá phải là một số hợp lệ.' });
        } else if (this.unitPrice < 0) {
            errors.push({ field: 'unitPrice', message: 'Đơn giá không được nhỏ hơn 0.' });
        }

        if (this.description && this.description.length > 1000) {
            errors.push({ field: 'description', message: 'Mô tả không được vượt quá 1000 ký tự.' });
        }

        if (!this.category) {
            errors.push({ field: 'category', message: 'Danh mục dịch vụ là bắt buộc.' });
        } else if (this.category.length > 255) {
            errors.push({ field: 'category', message: 'Danh mục dịch vụ không được vượt quá 255 ký tự.' });
        }

        return errors;
    }
}

module.exports = CreateServiceRequestDto;


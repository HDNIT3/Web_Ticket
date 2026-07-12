const toNumber = (value) => {
    if (value === null || typeof value === 'undefined' || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

class UpdateServiceRequestDto {
    constructor(body = {}) {
        this.name = typeof body.name === 'string' ? body.name.trim() : undefined;
        this.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : undefined;
        this.unitPrice = toNumber(body.unitPrice);
        this.description = typeof body.description === 'string' ? body.description.trim() : undefined;
        this.category = typeof body.category === 'string' ? body.category.trim() : undefined;
        this.isActive = typeof body.isActive === 'undefined' ? undefined : body.isActive === true || body.isActive === 'true' || body.isActive === 1 || body.isActive === '1';
    }

    validate() {
        const errors = [];

        if (typeof this.name !== 'undefined') {
            if (!this.name) {
                errors.push({ field: 'name', message: 'Tên dịch vụ không được để trống.' });
            } else if (this.name.length > 255) {
                errors.push({ field: 'name', message: 'Tên dịch vụ không được vượt quá 255 ký tự.' });
            }
        }

        if (typeof this.imageUrl !== 'undefined' && this.imageUrl.length > 500) {
            errors.push({ field: 'imageUrl', message: 'Image URL không được vượt quá 500 ký tự.' });
        }

        if (typeof this.unitPrice !== 'undefined') {
            if (!Number.isFinite(this.unitPrice)) {
                errors.push({ field: 'unitPrice', message: 'Đơn giá phải là một số hợp lệ.' });
            } else if (this.unitPrice < 0) {
                errors.push({ field: 'unitPrice', message: 'Đơn giá không được nhỏ hơn 0.' });
            }
        }

        if (typeof this.description !== 'undefined' && this.description.length > 1000) {
            errors.push({ field: 'description', message: 'Mô tả không được vượt quá 1000 ký tự.' });
        }

        if (typeof this.category !== 'undefined') {
            if (!this.category) {
                errors.push({ field: 'category', message: 'Danh mục dịch vụ không được để trống.' });
            } else if (this.category.length > 255) {
                errors.push({ field: 'category', message: 'Danh mục dịch vụ không được vượt quá 255 ký tự.' });
            }
        }

        return errors;
    }
}

module.exports = UpdateServiceRequestDto;


const VALID_PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

class EditProfileRequestDto {
    constructor(body = {}) {
        this.firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined;
        this.lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined;
        this.address = typeof body.address === 'string' ? body.address.trim() : undefined;
        this.phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : undefined;
    }

    validate() {
        const errors = [];
        const hasAny =
            this.firstName !== undefined ||
            this.lastName !== undefined ||
            this.address !== undefined ||
            this.phoneNumber !== undefined;

        if (!hasAny) {
            errors.push({ field: 'payload', message: 'Cần ít nhất một trường để cập nhật.' });
        }

        if (this.phoneNumber !== undefined && !VALID_PHONE_REGEX.test(this.phoneNumber)) {
            errors.push({ field: 'phoneNumber', message: 'Số điện thoại không đúng định dạng (VD: 0912345678).' });
        }

        return errors;
    }
}

module.exports = EditProfileRequestDto;
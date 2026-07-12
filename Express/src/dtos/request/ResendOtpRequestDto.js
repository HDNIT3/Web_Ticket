const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ResendOtpRequestDto {
    constructor(body = {}) {
        this.email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    }

    validate() {
        const errors = [];
        if (!this.email) {
            errors.push({ field: 'email', message: 'Email là bắt buộc.' });
        } else if (!VALID_EMAIL_REGEX.test(this.email)) {
            errors.push({ field: 'email', message: 'Email không đúng định dạng.' });
        }
        return errors;
    }
}

module.exports = ResendOtpRequestDto;


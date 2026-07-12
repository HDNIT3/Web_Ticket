const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class VerifyOtpRequestDto {
    constructor(body = {}) {
        this.email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        this.otp   = body.otp !== undefined ? String(body.otp).trim() : '';
    }

    validate() {
        const errors = [];

        if (!this.email) {
            errors.push({ field: 'email', message: 'Email là bắt buộc.' });
        } else if (!VALID_EMAIL_REGEX.test(this.email)) {
            errors.push({ field: 'email', message: 'Email không đúng định dạng.' });
        }

        if (!this.otp) {
            errors.push({ field: 'otp', message: 'OTP là bắt buộc.' });
        } else if (!/^\d{6}$/.test(this.otp)) {
            errors.push({ field: 'otp', message: 'OTP phải là 6 chữ số.' });
        }

        return errors;
    }
}

module.exports = VerifyOtpRequestDto;


const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class ResetPasswordRequestDto {
    constructor(body = {}) {
        this.email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        this.otp = body.otp !== undefined ? String(body.otp).trim() : '';
        this.newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';
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

        if (!this.newPassword) {
            errors.push({ field: 'newPassword', message: 'Mật khẩu mới là bắt buộc.' });
        } else if (this.newPassword.length < 6) {
            errors.push({ field: 'newPassword', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        } else if (this.newPassword.length > 128) {
            errors.push({ field: 'newPassword', message: 'Mật khẩu mới không được vượt quá 128 ký tự.' });
        }

        return errors;
    }
}

module.exports = ResetPasswordRequestDto;
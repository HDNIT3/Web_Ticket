const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class LoginRequestDto {
    constructor(body = {}) {
        this.email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : '';
        this.password = typeof body.password === 'string' ? body.password.trim()              : '';
    }

    validate() {
        const errors = [];

        if (!this.email) {
            errors.push({ field: 'email', message: 'Email là bắt buộc.' });
        } else if (!VALID_EMAIL_REGEX.test(this.email)) {
            errors.push({ field: 'email', message: 'Email không đúng định dạng.' });
        }

        if (!this.password) {
            errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc.' });
        } else if (this.password.length < 6) {
            errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        } else if (this.password.length > 128) {
            errors.push({ field: 'password', message: 'Mật khẩu không được vượt quá 128 ký tự.' });
        }

        return errors;
    }
}

module.exports = LoginRequestDto;
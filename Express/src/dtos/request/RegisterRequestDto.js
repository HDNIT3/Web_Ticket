const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

class RegisterRequestDto {
    constructor(body = {}) {
        this.email       = typeof body.email       === 'string' ? body.email.trim().toLowerCase()   : '';
        this.password    = typeof body.password    === 'string' ? body.password.trim()              : '';
        this.username    = typeof body.username    === 'string' ? body.username.trim()    : null;
        this.firstName   = typeof body.firstName   === 'string' ? body.firstName.trim()  : null;
        this.lastName    = typeof body.lastName    === 'string' ? body.lastName.trim()   : null;
        this.phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim(): null;
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

        if (this.username) {
            if (this.username.length < 3) {
                errors.push({ field: 'username', message: 'Username phải có ít nhất 3 ký tự.' });
            } else if (this.username.length > 30) {
                errors.push({ field: 'username', message: 'Username không được vượt quá 30 ký tự.' });
            } else if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
                errors.push({ field: 'username', message: 'Username chỉ được chứa chữ, số và dấu gạch dưới (_).' });
            }
        }

        if (this.firstName && this.firstName.length > 50) {
            errors.push({ field: 'firstName', message: 'Tên không được vượt quá 50 ký tự.' });
        }

        if (this.lastName && this.lastName.length > 50) {
            errors.push({ field: 'lastName', message: 'Họ không được vượt quá 50 ký tự.' });
        }

        if (this.phoneNumber && !VALID_PHONE_REGEX.test(this.phoneNumber)) {
            errors.push({ field: 'phoneNumber', message: 'Số điện thoại không đúng định dạng (VD: 0912345678).' });
        }

        return errors;
    }
}

module.exports = RegisterRequestDto;


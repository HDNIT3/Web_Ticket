class GoogleLoginRequestDto {
    constructor(body = {}) {
        this.token = typeof body.token === 'string' ? body.token.trim() : '';
    }

    validate() {
        const errors = [];

        if (!this.token) {
            errors.push({ field: 'token', message: 'Token Google là bắt buộc.' });
        }

        return errors;
    }
}

module.exports = GoogleLoginRequestDto;

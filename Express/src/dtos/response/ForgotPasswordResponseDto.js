class ForgotPasswordResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }
    static ok() {
        return new ForgotPasswordResponseDto(true, 'Mã xác thực đã được gửi đi. Vui lòng kiểm tra hộp thư.', null);
    }
    static fail(message) {
        return new ForgotPasswordResponseDto(false, message, null);
    }
}

module.exports = ForgotPasswordResponseDto;
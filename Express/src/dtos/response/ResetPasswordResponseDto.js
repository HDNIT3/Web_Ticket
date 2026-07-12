class ResetPasswordResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok() {
        return new ResetPasswordResponseDto(true, 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.', null);
    }

    static fail(message) {
        return new ResetPasswordResponseDto(false, message, null);
    }
}

module.exports = ResetPasswordResponseDto;
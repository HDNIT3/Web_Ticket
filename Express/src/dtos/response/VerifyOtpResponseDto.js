class VerifyOtpResponseDto {
    constructor({ success, message }) {
        this.success = success;
        this.message = message;
    }

    static ok() {
        return new VerifyOtpResponseDto({
            success: true,
            message: 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.'
        });
    }

    static fail(message) {
        return new VerifyOtpResponseDto({ success: false, message });
    }
}

module.exports = VerifyOtpResponseDto;


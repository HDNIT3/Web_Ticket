class RegisterResponseDto {
    constructor({ success, message }) {
        this.success = success;
        this.message = message;
    }

    static ok() {
        return new RegisterResponseDto({
            success: true,
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP kích hoạt tài khoản (hiệu lực 5 phút).'
        });
    }

    static fail(message) {
        return new RegisterResponseDto({ success: false, message });
    }
}

module.exports = RegisterResponseDto;


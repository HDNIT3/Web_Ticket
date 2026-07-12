class LoginResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data) {
        return new LoginResponseDto(true, 'Đăng nhập thành công!', data);
    }

    static fail(message) {
        return new LoginResponseDto(false, message, null);
    }
}

module.exports = LoginResponseDto;
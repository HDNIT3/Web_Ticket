class EditProfileResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data) {
        return new EditProfileResponseDto(true, 'Cập nhật hồ sơ thành công!', data);
    }

    static fail(message) {
        return new EditProfileResponseDto(false, message, null);
    }
}

module.exports = EditProfileResponseDto;
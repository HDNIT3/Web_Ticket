class ServiceResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data, message = 'Xử lý dịch vụ thành công!') {
        return new ServiceResponseDto(true, message, data);
    }

    static fail(message) {
        return new ServiceResponseDto(false, message, null);
    }
}

module.exports = ServiceResponseDto;


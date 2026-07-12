class PromotionResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data, message = 'Xử lý khuyến mãi thành công!') {
        return new PromotionResponseDto(true, message, data);
    }

    static fail(message) {
        return new PromotionResponseDto(false, message, null);
    }
}

module.exports = PromotionResponseDto;


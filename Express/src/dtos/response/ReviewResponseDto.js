class ReviewResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data, message = 'Xử lý đánh giá thành công!') {
        return new ReviewResponseDto(true, message, data);
    }

    static fail(message) {
        return new ReviewResponseDto(false, message, null);
    }
}

module.exports = ReviewResponseDto;

class GenreResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data, message = 'Xử lý thể loại thành công!') {
        return new GenreResponseDto(true, message, data);
    }

    static fail(message) {
        return new GenreResponseDto(false, message, null);
    }
}

module.exports = GenreResponseDto;
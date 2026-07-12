class MovieResponseDto {
    constructor(success, message, data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    static ok(data, message = 'Xử lý phim thành công!') {
        return new MovieResponseDto(true, message, data);
    }

    static fail(message) {
        return new MovieResponseDto(false, message, null);
    }
}

module.exports = MovieResponseDto;
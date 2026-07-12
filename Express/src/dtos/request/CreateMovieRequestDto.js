const { MovieStatus } = require('../../enums');
const VALID_STATUSES = Object.values(MovieStatus);

const toNumber = (value) => {
    if (value === null || typeof value === 'undefined' || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

const toDate = (value) => {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date('invalid') : parsed;
};

const toGenres = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => `${item}`.trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
};

const isValidUrl = (url) => {
    if (!url) return true;
    return url.startsWith('http://') || url.startsWith('https://');
};

class CreateMovieRequestDto {
    constructor(body = {}) {
        this.title = typeof body.title === 'string' ? body.title.trim() : '';
        this.description = typeof body.description === 'string' ? body.description.trim() : '';
        this.director = typeof body.director === 'string' ? body.director.trim() : '';
        this.cast = typeof body.cast === 'string' ? body.cast.trim() : '';
        this.durationMinutes = toNumber(body.durationMinutes);
        this.releaseDate = toDate(body.releaseDate);
        this.posterUrl = typeof body.posterUrl === 'string' ? body.posterUrl.trim() : '';
        this.trailerUrl = typeof body.trailerUrl === 'string' ? body.trailerUrl.trim() : '';
        this.ageRating = typeof body.ageRating === 'string' ? body.ageRating.trim() : '';
        this.status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';

        this.genres = toGenres(body.genres);
    }

    validate() {
        const errors = [];

        if (!this.title) {
            errors.push({ field: 'title', message: 'Tên phim là bắt buộc.' });
        } else if (this.title.length > 255) {
            errors.push({ field: 'title', message: 'Tên phim không được vượt quá 255 ký tự.' });
        }

        if (this.description && this.description.length > 1000) {
            errors.push({ field: 'description', message: 'Mô tả không được vượt quá 1000 ký tự.' });
        }

        if (this.director && this.director.length > 255) {
            errors.push({ field: 'director', message: 'Tên đạo diễn không được vượt quá 255 ký tự.' });
        }

        if (this.cast && this.cast.length > 500) {
            errors.push({ field: 'cast', message: 'Danh sách diễn viên không được vượt quá 500 ký tự.' });
        }

        if (typeof this.durationMinutes === 'undefined') {
            errors.push({ field: 'durationMinutes', message: 'Thời lượng phim là bắt buộc.' });
        } else if (!Number.isFinite(this.durationMinutes)) {
            errors.push({ field: 'durationMinutes', message: 'Thời lượng phim phải là một số hợp lệ.' });
        } else if (this.durationMinutes < 0) {
            errors.push({ field: 'durationMinutes', message: 'Thời lượng phim không được nhỏ hơn 0.' });
        }

        if (typeof this.releaseDate !== 'undefined' && Number.isNaN(this.releaseDate.getTime())) {
            errors.push({ field: 'releaseDate', message: 'Ngày khởi chiếu không hợp lệ.' });
        }

        if (this.posterUrl && this.posterUrl.length > 500) {
            errors.push({ field: 'posterUrl', message: 'Poster URL không được vượt quá 500 ký tự.' });
        } else if (this.posterUrl && !isValidUrl(this.posterUrl)) {
            errors.push({ field: 'posterUrl', message: 'URL poster không hợp lệ. Vui lòng dùng link bắt đầu bằng http/https.' });
        }

        if (this.trailerUrl && this.trailerUrl.length > 500) {
            errors.push({ field: 'trailerUrl', message: 'Trailer URL không được vượt quá 500 ký tự.' });
        } else if (this.trailerUrl && !isValidUrl(this.trailerUrl)) {
            errors.push({ field: 'trailerUrl', message: 'URL trailer không hợp lệ. Vui lòng dùng link bắt đầu bằng http/https.' });
        }

        if (!this.ageRating) {
            errors.push({ field: 'ageRating', message: 'Xếp hạng độ tuổi là bắt buộc.' });
        } else if (this.ageRating.length > 20) {
            errors.push({ field: 'ageRating', message: 'Xếp hạng độ tuổi không được vượt quá 20 ký tự.' });
        }

        if (!VALID_STATUSES.includes(this.status)) {
            errors.push({ field: 'status', message: 'Trạng thái phim phải là COMING_SOON, NOW_SHOWING hoặc STOPPED.' });
        }

        if (!this.genres || this.genres.length === 0) {
            errors.push({ field: 'genres', message: 'Vui lòng chọn ít nhất một thể loại phim.' });
        }

        return errors;
    }
}

module.exports = CreateMovieRequestDto;
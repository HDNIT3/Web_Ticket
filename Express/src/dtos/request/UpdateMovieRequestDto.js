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
    if (typeof value === 'undefined') {
        return undefined;
    }

    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date('invalid') : parsed;
};

const toGenres = (value) => {
    if (typeof value === 'undefined') {
        return undefined;
    }

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

class UpdateMovieRequestDto {
    constructor(body = {}) {
        this.title = typeof body.title === 'string' ? body.title.trim() : undefined;
        this.description = typeof body.description === 'string' ? body.description.trim() : undefined;
        this.director = typeof body.director === 'string' ? body.director.trim() : undefined;
        this.cast = typeof body.cast === 'string' ? body.cast.trim() : undefined;
        this.durationMinutes = toNumber(body.durationMinutes);
        this.releaseDate = toDate(body.releaseDate);
        this.posterUrl = typeof body.posterUrl === 'string' ? body.posterUrl.trim() : undefined;
        this.trailerUrl = typeof body.trailerUrl === 'string' ? body.trailerUrl.trim() : undefined;
        this.ageRating = typeof body.ageRating === 'string' ? body.ageRating.trim() : undefined;
        this.status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : undefined;

        this.genres = toGenres(body.genres);
    }

    validate() {
        const errors = [];

        if (typeof this.title !== 'undefined') {
            if (!this.title) {
                errors.push({ field: 'title', message: 'Tên phim không được để trống.' });
            } else if (this.title.length > 255) {
                errors.push({ field: 'title', message: 'Tên phim không được vượt quá 255 ký tự.' });
            }
        }

        if (typeof this.description !== 'undefined' && this.description.length > 1000) {
            errors.push({ field: 'description', message: 'Mô tả không được vượt quá 1000 ký tự.' });
        }

        if (typeof this.director !== 'undefined' && this.director.length > 255) {
            errors.push({ field: 'director', message: 'Tên đạo diễn không được vượt quá 255 ký tự.' });
        }

        if (typeof this.cast !== 'undefined' && this.cast.length > 500) {
            errors.push({ field: 'cast', message: 'Danh sách diễn viên không được vượt quá 500 ký tự.' });
        }

        if (typeof this.durationMinutes !== 'undefined') {
            if (!Number.isFinite(this.durationMinutes)) {
                errors.push({ field: 'durationMinutes', message: 'Thời lượng phim phải là một số hợp lệ.' });
            } else if (this.durationMinutes < 0) {
                errors.push({ field: 'durationMinutes', message: 'Thời lượng phim không được nhỏ hơn 0.' });
            }
        }

        if (typeof this.releaseDate !== 'undefined' && this.releaseDate && Number.isNaN(this.releaseDate.getTime())) {
            errors.push({ field: 'releaseDate', message: 'Ngày khởi chiếu không hợp lệ.' });
        }

        if (typeof this.posterUrl !== 'undefined' && this.posterUrl.length > 500) {
            errors.push({ field: 'posterUrl', message: 'Poster URL không được vượt quá 500 ký tự.' });
        } else if (typeof this.posterUrl !== 'undefined' && this.posterUrl && !isValidUrl(this.posterUrl)) {
            errors.push({ field: 'posterUrl', message: 'URL poster không hợp lệ. Vui lòng dùng link bắt đầu bằng http/https.' });
        }

        if (typeof this.trailerUrl !== 'undefined' && this.trailerUrl.length > 500) {
            errors.push({ field: 'trailerUrl', message: 'Trailer URL không được vượt quá 500 ký tự.' });
        } else if (typeof this.trailerUrl !== 'undefined' && this.trailerUrl && !isValidUrl(this.trailerUrl)) {
            errors.push({ field: 'trailerUrl', message: 'URL trailer không hợp lệ. Vui lòng dùng link bắt đầu bằng http/https.' });
        }

        if (typeof this.ageRating !== 'undefined') {
            if (!this.ageRating) {
                errors.push({ field: 'ageRating', message: 'Xếp hạng độ tuổi không được để trống.' });
            } else if (this.ageRating.length > 20) {
                errors.push({ field: 'ageRating', message: 'Xếp hạng độ tuổi không được vượt quá 20 ký tự.' });
            }
        }

        if (typeof this.status !== 'undefined' && !VALID_STATUSES.includes(this.status)) {
            errors.push({ field: 'status', message: 'Trạng thái phim phải là COMING_SOON, NOW_SHOWING hoặc STOPPED.' });
        }

        if (typeof this.genres !== 'undefined') {
            if (!this.genres || this.genres.length === 0) {
                errors.push({ field: 'genres', message: 'Vui lòng chọn ít nhất một thể loại phim.' });
            }
        }

        return errors;
    }
}

module.exports = UpdateMovieRequestDto;
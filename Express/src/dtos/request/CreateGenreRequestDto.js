class CreateGenreRequestDto {
    constructor(body = {}) {
        this.name = typeof body.name === 'string' ? body.name.trim() : '';
    }

    validate() {
        const errors = [];

        if (!this.name) {
            errors.push({ field: 'name', message: 'Tên thể loại là bắt buộc.' });
        } else if (this.name.length > 255) {
            errors.push({ field: 'name', message: 'Tên thể loại không được vượt quá 255 ký tự.' });
        }

        return errors;
    }
}

module.exports = CreateGenreRequestDto;
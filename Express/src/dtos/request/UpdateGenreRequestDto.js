class UpdateGenreRequestDto {
    constructor(body = {}) {
        this.name = typeof body.name === 'string' ? body.name.trim() : undefined;
    }

    validate() {
        const errors = [];

        if (typeof this.name !== 'undefined') {
            if (!this.name) {
                errors.push({ field: 'name', message: 'Tên thể loại không được để trống.' });
            } else if (this.name.length > 255) {
                errors.push({ field: 'name', message: 'Tên thể loại không được vượt quá 255 ký tự.' });
            }
        }

        return errors;
    }
}

module.exports = UpdateGenreRequestDto;
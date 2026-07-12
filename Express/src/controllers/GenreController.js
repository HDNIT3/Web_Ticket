const GenreService = require('../services/GenreService');
const GenreResponseDto = require('../dtos/response/GenreResponseDto');

const GenreController = {
    getGenres: async (req, res) => {
        try {
            const data = await GenreService.getGenres();
            return res.status(200).json(GenreResponseDto.ok(data, 'Lấy danh sách thể loại thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GenreResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    getGenreById: async (req, res) => {
        try {
            const data = await GenreService.getGenreById(req.params.id);
            return res.status(200).json(GenreResponseDto.ok(data, 'Lấy thể loại thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GenreResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    createGenre: async (req, res) => {
        try {
            const data = await GenreService.createGenre(req.dto);
            return res.status(201).json(GenreResponseDto.ok(data, 'Tạo thể loại thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GenreResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    updateGenre: async (req, res) => {
        try {
            const data = await GenreService.updateGenre(req.params.id, req.dto);
            return res.status(200).json(GenreResponseDto.ok(data, 'Cập nhật thể loại thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GenreResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    deleteGenre: async (req, res) => {
        try {
            await GenreService.deleteGenre(req.params.id);
            return res.status(200).json(GenreResponseDto.ok(null, 'Xóa thể loại thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GenreResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
};

module.exports = GenreController;
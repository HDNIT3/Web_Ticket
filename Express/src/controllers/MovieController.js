const MovieService = require('../services/MovieService');
const MovieResponseDto = require('../dtos/response/MovieResponseDto');

const MovieController = {
    getMovies: async (req, res) => {
        try {
            const data = await MovieService.getMovies(req.query);
            return res.status(200).json(MovieResponseDto.ok(data, 'Lấy danh sách phim thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    getMovieById: async (req, res) => {
        try {
            const data = await MovieService.getMovieById(req.params.id);
            return res.status(200).json(MovieResponseDto.ok(data, 'Lấy phim thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    createMovie: async (req, res) => {
        try {
            const data = await MovieService.createMovie(req.dto);
            return res.status(201).json(MovieResponseDto.ok(data, 'Tạo phim thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    updateMovie: async (req, res) => {
        try {
            const data = await MovieService.updateMovie(req.params.id, req.dto);
            return res.status(200).json(MovieResponseDto.ok(data, 'Cập nhật phim thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    deleteMovie: async (req, res) => {
        try {
            await MovieService.deleteMovie(req.params.id);
            return res.status(200).json(MovieResponseDto.ok(null, 'Xóa phim thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    getSimilarMovies: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit, 10) || 8;
            const data = await MovieService.getSimilarMovies(req.params.id, limit);
            return res.status(200).json(MovieResponseDto.ok(data, 'Lấy phim tương tự thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                MovieResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
};

module.exports = MovieController;
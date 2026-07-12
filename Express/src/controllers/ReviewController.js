const ReviewService = require('../services/ReviewService');
const ReviewResponseDto = require('../dtos/response/ReviewResponseDto');

const ReviewController = {
  createReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await ReviewService.createReview(userId, req.body);
      return res.status(201).json(ReviewResponseDto.ok(data, 'Đánh giá phim thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể tạo đánh giá.')
      );
    }
  },

  updateReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const reviewId = req.params.reviewId;
      const data = await ReviewService.updateReview(reviewId, userId, req.body);
      return res.status(200).json(ReviewResponseDto.ok(data, 'Cập nhật đánh giá thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể cập nhật đánh giá.')
      );
    }
  },

  deleteReview: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const reviewId = req.params.reviewId;
      await ReviewService.deleteReview(reviewId, userId, userRole);
      return res.status(200).json(ReviewResponseDto.ok(null, 'Xóa đánh giá thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể xóa đánh giá.')
      );
    }
  },

  getMyReviews: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await ReviewService.getMyReviews(userId);
      return res.status(200).json(ReviewResponseDto.ok(data, 'Lấy danh sách đánh giá của bạn thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể lấy danh sách đánh giá.')
      );
    }
  },

  getMovieReviewsAndStats: async (req, res) => {
    try {
      const movieId = req.params.movieId;
      const data = await ReviewService.getMovieReviewsAndStats(movieId, req.query);
      return res.status(200).json(ReviewResponseDto.ok(data, 'Lấy đánh giá phim thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể lấy đánh giá phim.')
      );
    }
  },

  getAdminReviews: async (req, res) => {
    try {
      const data = await ReviewService.getAdminReviews(req.query);
      return res.status(200).json(ReviewResponseDto.ok(data, 'Lấy danh sách đánh giá thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể lấy danh sách đánh giá.')
      );
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const data = await ReviewService.getAdminStats(req.query);
      return res.status(200).json(ReviewResponseDto.ok(data, 'Lấy thống kê đánh giá thành công!'));
    } catch (error) {
      return res.status(error.statusCode || 500).json(
        ReviewResponseDto.fail(error.message || 'Không thể lấy thống kê đánh giá.')
      );
    }
  }
};

module.exports = ReviewController;

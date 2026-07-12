const User = require('../models/user');
const mongoose = require('mongoose');

const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message, data: null });

const FavoriteController = {
  getMyFavorites: async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .populate({
          path: 'favorites',
          populate: { path: 'genres', select: '_id name' },
        })
        .select('favorites');

      if (!user) return fail(res, 'Không tìm thấy user.', 404);

      return ok(res, user.favorites || [], 'Lấy danh sách yêu thích thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  addFavorite: async (req, res) => {
    try {
      const { movieId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return fail(res, 'ID phim không hợp lệ.');
      }

      const user = await User.findById(req.user.id);
      if (!user) return fail(res, 'Không tìm thấy user.', 404);

      const alreadyFav = user.favorites.some((id) => id.toString() === movieId);
      if (alreadyFav) {
        return ok(res, null, 'Phim đã có trong danh sách yêu thích.');
      }

      user.favorites.push(new mongoose.Types.ObjectId(movieId));
      await user.save();

      return ok(res, null, 'Đã thêm phim vào danh sách yêu thích!', 201);
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  removeFavorite: async (req, res) => {
    try {
      const { movieId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return fail(res, 'ID phim không hợp lệ.');
      }

      const user = await User.findById(req.user.id);
      if (!user) return fail(res, 'Không tìm thấy user.', 404);

      user.favorites = user.favorites.filter((id) => id.toString() !== movieId);
      await user.save();

      return ok(res, null, 'Đã xóa phim khỏi danh sách yêu thích.');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  checkFavorite: async (req, res) => {
    try {
      const { movieId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return fail(res, 'ID phim không hợp lệ.');
      }

      const user = await User.findById(req.user.id).select('favorites');
      if (!user) return fail(res, 'Không tìm thấy user.', 404);

      const isFavorite = user.favorites.some((id) => id.toString() === movieId);

      return ok(res, { isFavorite }, 'Kiểm tra yêu thích thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },
};

module.exports = FavoriteController;

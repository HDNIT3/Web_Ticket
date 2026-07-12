const ShowtimeService = require('../services/ShowtimeService');

const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, err) =>
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.',
  });

const ShowtimeController = {
  getShowtimes: async (req, res) => {
    try {
      const data = await ShowtimeService.getShowtimes(req.query);
      return ok(res, data, 'Lấy danh sách suất chiếu thành công!');
    } catch (err) {
      return fail(res, err);
    }
  },

  getShowtimeById: async (req, res) => {
    try {
      const data = await ShowtimeService.getShowtimeById(req.params.id);
      return ok(res, data, 'Lấy suất chiếu thành công!');
    } catch (err) {
      return fail(res, err);
    }
  },



  createShowtime: async (req, res) => {
    try {
      const data = await ShowtimeService.createShowtime(req.body);
      return ok(res, data, 'Tạo suất chiếu thành công!', 201);
    } catch (err) {
      return fail(res, err);
    }
  },

  updateShowtime: async (req, res) => {
    try {
      const data = await ShowtimeService.updateShowtime(req.params.id, req.body);
      return ok(res, data, 'Cập nhật suất chiếu thành công!');
    } catch (err) {
      return fail(res, err);
    }
  },

  deleteShowtime: async (req, res) => {
    try {
      await ShowtimeService.deleteShowtime(req.params.id);
      return ok(res, null, 'Xóa suất chiếu thành công!');
    } catch (err) {
      return fail(res, err);
    }
  },
};

module.exports = ShowtimeController;

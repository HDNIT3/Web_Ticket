const PointService = require('../services/PointService');

const PointController = {
  // User kiểm tra điểm hiện tại (dùng ở trang thanh toán)
  getPointsBalance: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await PointService.getPointsBalance(userId);
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin điểm thành công!',
        data
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Không thể lấy thông tin điểm.',
        data: null
      });
    }
  },

  // User tự xem điểm + lịch sử của mình
  getMyPoints: async (req, res) => {
    try {
      const userId = req.user.id;
      const data = await PointService.getMyPoints(userId);
      return res.status(200).json({
        success: true,
        message: 'Lấy thông tin điểm thành công!',
        data
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Không thể lấy thông tin điểm.',
        data: null
      });
    }
  },

  // Admin: Lấy danh sách tất cả user kèm điểm
  getAllUsersPoints: async (req, res) => {
    try {
      const data = await PointService.getAllUsersPoints(req.query);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách điểm người dùng thành công!',
        data
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Không thể lấy danh sách điểm.',
        data: null
      });
    }
  },

  // Admin: Xem chi tiết lịch sử điểm của một user cụ thể
  getUserPointsById: async (req, res) => {
    try {
      const { userId } = req.params;
      const data = await PointService.getUserPointsById(userId);
      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết điểm người dùng thành công!',
        data
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Không thể lấy chi tiết điểm.',
        data: null
      });
    }
  }
};

module.exports = PointController;

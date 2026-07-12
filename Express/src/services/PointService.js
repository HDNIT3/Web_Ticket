const UserPointLog = require('../models/userPointLog');
const User = require('../models/user');

// Quy đổi: 1 điểm = 1.000 VND
const POINT_VALUE_VND = 1000;
// Mỗi lần thanh toán chỉ được dùng tối đa 50 điểm
const MAX_REDEEM_PER_ORDER = 50;

function throwError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

const PointService = {
  /**
   * Trao điểm lần đầu đánh giá phim.
   * Nếu user đã từng được tích điểm cho (user + movie + showtime) này → bỏ qua.
   * Trả về { awarded: true/false, points: 10 }
   */
  async awardFirstReviewPoints(userId, movieId, movieTitle, showtimeId) {
    const existing = await UserPointLog.findOne({
      user: userId,
      movie: movieId,
      showtime: showtimeId
    });

    if (existing) {
      return { awarded: false, points: 0 };
    }

    const POINTS_PER_FIRST_REVIEW = 10;

    await UserPointLog.create({
      user: userId,
      movie: movieId,
      movieTitle: movieTitle || '',
      showtime: showtimeId,
      points: POINTS_PER_FIRST_REVIEW,
      reason: 'FIRST_REVIEW'
    });

    await User.updateOne(
      { _id: userId },
      { $inc: { loyaltyPoints: POINTS_PER_FIRST_REVIEW } }
    );

    return { awarded: true, points: POINTS_PER_FIRST_REVIEW };
  },

  /**
   * Kiểm tra số điểm hiện tại của user (dùng khi vào trang thanh toán).
   * Trả về: { totalPoints, maxRedeemPoints, maxRedeemVnd, pointValueVnd, maxPerOrder }
   */
  async getPointsBalance(userId) {
    const user = await User.findById(userId).select('loyaltyPoints');
    if (!user) throwError('Người dùng không tồn tại.', 404);

    const totalPoints = user.loyaltyPoints || 0;
    const canRedeem = Math.min(totalPoints, MAX_REDEEM_PER_ORDER);

    return {
      totalPoints,
      maxRedeemPoints: canRedeem,
      maxRedeemVnd: canRedeem * POINT_VALUE_VND,
      pointValueVnd: POINT_VALUE_VND,
      maxPerOrder: MAX_REDEEM_PER_ORDER
    };
  },

  /**
   * Dùng điểm để thanh toán (trừ điểm user).
   * pointsToUse: số điểm muốn dùng (phải > 0, <= min(loyaltyPoints, MAX_REDEEM_PER_ORDER))
   * Trả về số VND được giảm.
   */
  async redeemPoints(userId, pointsToUse) {
    if (!pointsToUse || pointsToUse <= 0) return 0;

    const user = await User.findById(userId).select('loyaltyPoints');
    if (!user) throwError('Người dùng không tồn tại.', 404);

    const actualPoints = Math.min(
      Math.floor(pointsToUse),
      user.loyaltyPoints || 0,
      MAX_REDEEM_PER_ORDER
    );

    if (actualPoints <= 0) return 0;

    const discountVnd = actualPoints * POINT_VALUE_VND;

    // Trừ điểm
    await User.updateOne(
      { _id: userId },
      { $inc: { loyaltyPoints: -actualPoints } }
    );

    // Ghi log trừ điểm (points âm = dùng điểm)
    await UserPointLog.create({
      user: userId,
      movie: null,
      movieTitle: 'Dùng điểm đặt vé',
      showtime: null,
      points: -actualPoints,
      reason: 'REDEEM'
    });

    return discountVnd;
  },

  /**
   * Hoàn điểm khi booking bị hủy / thanh toán thất bại.
   * pointsToRestore: số điểm cần hoàn lại (phải > 0)
   */
  async restorePoints(userId, pointsToRestore) {
    if (!pointsToRestore || pointsToRestore <= 0) return;

    // Cộng lại điểm
    await User.updateOne(
      { _id: userId },
      { $inc: { loyaltyPoints: pointsToRestore } }
    );

    // Ghi log hoàn điểm
    await UserPointLog.create({
      user: userId,
      movie: null,
      movieTitle: 'Hoàn điểm (hủy/thất bại thanh toán)',
      showtime: null,
      points: pointsToRestore,
      reason: 'REDEEM'  // dùng chung enum REDEEM, points dương = hoàn
    });
  },

  /**
   * Lấy điểm + lịch sử tích điểm của một user (dành cho user tự xem).
   */
  async getMyPoints(userId) {
    const user = await User.findById(userId).select('loyaltyPoints firstName lastName username email');
    if (!user) throwError('Người dùng không tồn tại.', 404);

    const logs = await UserPointLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('movie', 'title posterUrl')
      .populate('showtime', 'startTime')
      .lean();

    return {
      totalPoints: user.loyaltyPoints || 0,
      logs
    };
  },

  /**
   * Dành cho Admin: Lấy danh sách tất cả user kèm điểm.
   */
  async getAllUsersPoints(query = {}) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { role: 'USER' };

    if (query.q) {
      const keyword = query.q.trim();
      if (keyword) {
        filter.$or = [
          { username: { $regex: keyword, $options: 'i' } },
          { firstName: { $regex: keyword, $options: 'i' } },
          { lastName: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ];
      }
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username firstName lastName email loyaltyPoints image createdAt')
        .sort({ loyaltyPoints: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return {
      currentPage: page,
      currentItem: users,
      totalPage: Math.max(Math.ceil(total / limit), 1),
      totalItems: total
    };
  },

  /**
   * Dành cho Admin: Xem chi tiết lịch sử điểm của một user.
   */
  async getUserPointsById(userId) {
    const user = await User.findById(userId).select('loyaltyPoints firstName lastName username email image');
    if (!user) throwError('Người dùng không tồn tại.', 404);

    const logs = await UserPointLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('movie', 'title posterUrl')
      .populate('showtime', 'startTime')
      .lean();

    return {
      user: {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image,
        loyaltyPoints: user.loyaltyPoints || 0
      },
      logs
    };
  }
};

module.exports = PointService;

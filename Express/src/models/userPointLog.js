const mongoose = require('mongoose');

/**
 * Collection riêng để lưu lịch sử tích điểm của user.
 * Không ảnh hưởng đến bất kỳ collection nào đã có.
 */
const userPointLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: false,
      index: true
    },
    // Snapshot tên phim tại thời điểm tích điểm (để hiển thị khi phim bị đổi tên)
    movieTitle: {
      type: String,
      default: ''
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: false
    },
    // Điểm được cộng (dương = tích, âm = dùng)
    points: {
      type: Number,
      required: true,
      default: 10
    },
    // Lý do tích/dùng điểm
    reason: {
      type: String,
      enum: ['FIRST_REVIEW', 'REDEEM'],
      default: 'FIRST_REVIEW'
    }
  },
  {
    timestamps: true,
    collection: 'user_points_logs'
  }
);

// Unique compound index: mỗi user chỉ được tích điểm 1 lần cho 1 bộ phim ở 1 suất chiếu
userPointLogSchema.index({ user: 1, movie: 1, showtime: 1 }, { unique: true });

module.exports =
  mongoose.models.UserPointLog ||
  mongoose.model('UserPointLog', userPointLogSchema);

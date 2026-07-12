const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Người nhận (null = broadcast đến tất cả)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['NEW_MOVIE', 'NEW_SHOWTIME', 'SYSTEM', 'BOOKING', 'REVIEW', 'BROADCAST'],
      required: true
    },
    // Người gửi (admin tạo broadcast)
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    // Dữ liệu liên quan (bookingId, reviewId, movieId...)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
      default: null
    },
    onModel: {
      type: String,
      enum: ['Movie', 'Showtime', 'Booking', 'Review'],
      default: null
    },
    // Đối tượng nhận (ALL = broadcast, ADMIN = chỉ admin)
    targetAudience: {
      type: String,
      enum: ['ALL', 'ADMIN', 'SINGLE'],
      default: 'SINGLE'
    },
    isRead: { type: Boolean, default: false },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
  },
  {
    timestamps: true,
    collection: 'notifications'
  }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

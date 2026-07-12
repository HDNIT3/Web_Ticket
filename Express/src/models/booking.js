const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    bookingSource: {
      type: String,
      enum: ['ONLINE', 'COUNTER'],
      default: 'ONLINE',
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    customerName: {
      type: String
    },
    customerPhone: {
      type: String
    },
    customerEmail: {
      type: String
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true
    },
    // Chứa danh sách ID của các Vé thuộc đơn này
    tickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
      }
    ],
    // Chứa danh sách ID của các Dịch vụ bắp nước đã đặt
    bookingExtras: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookingExtra'
      }
    ],
    // Liên kết ID tới bảng thanh toán (Có thể null khi mới tạo đơn)
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    // Số điểm tích lũy đã dùng cho đơn này (để hoàn lại khi hủy)
    pointsUsed: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true, collection: 'bookings' }
);

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

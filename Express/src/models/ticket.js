const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true,
      index: true // Tạo index để tìm nhanh toàn bộ vé của 1 đơn
    },
    seat: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Seat', 
      required: true 
    },
    finalPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    status: { 
      type: String, 
      enum: ['LOCKED', 'PAID', 'CHECKED_IN', 'CANCELLED', 'REFUNDED'], 
      default: 'LOCKED' 
    },
    qrCodeUrl: { 
      type: String 
    },
    checkedInAt: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Thông tin khuyến mãi nếu áp dụng riêng trên từng vé
    promotion: {
      promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
      discountAmount: { type: Number, default: 0 }
    }
  },
  { timestamps: true, collection: 'tickets' }
);

// Tránh việc 1 ghế bị đặt trùng 2 lần trong cùng một suất chiếu
// Existing index for seat+status
ticketSchema.index({ seat: 1, status: 1 });
// Compound index for booking+seat+status improves conflict lookup
ticketSchema.index({ booking: 1, seat: 1, status: 1 });
// TTL index to auto‑expire LOCKED tickets after 10 minutes (600 s)
// This releases the seat if payment is not completed in time
ticketSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600, partialFilterExpression: { status: 'LOCKED' } });

module.exports = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

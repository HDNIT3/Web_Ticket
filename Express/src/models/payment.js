const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true,
      unique: true // Quan hệ 1-1
    },
    paymentMethod: { 
      type: String, 
      required: true 
    }, // VD: MOMO, VNPAY, CASH
    message: { 
      type: String 
    },
    paytime: { 
      type: Date 
    },
      email: {
        type: String
      },
      number: {
        type: String // STK-NameNganHang
      }
  },
  { timestamps: true, collection: 'payments' }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

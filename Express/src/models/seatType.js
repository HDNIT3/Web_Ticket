const mongoose = require('mongoose');

const seatTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 255,
    },
    surchargeAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'seat_types',
  }
);

module.exports = mongoose.models.SeatType || mongoose.model('SeatType', seatTypeSchema);

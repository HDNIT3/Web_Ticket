const mongoose = require('mongoose');
const { SeatStatus } = require('../enums');

const seatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
    rowIndex: {
      type: Number,
      required: true,
      min: 1,
    },
    columnIndex: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SeatStatus),
      default: SeatStatus.AVAILABLE,
    },
    seatType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SeatType',
      required: true,
    },
    auditorium: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auditorium',
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
    collection: 'seats',
  }
);

seatSchema.index({ name: 1, auditorium: 1 }, { unique: true });

module.exports = mongoose.models.Seat || mongoose.model('Seat', seatSchema);

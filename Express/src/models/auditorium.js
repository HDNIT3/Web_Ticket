const mongoose = require('mongoose');
const { AuditoriumStatus } = require('../enums');

const auditoriumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 255,
    },
    seatCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalRows: {
      type: Number,
      required: true,
      min: 1,
    },
    totalColumns: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(AuditoriumStatus),
      default: AuditoriumStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    collection: 'auditoriums',
  }
);

auditoriumSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.models.Auditorium || mongoose.model('Auditorium', auditoriumSchema);

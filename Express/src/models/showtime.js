const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    auditorium: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auditorium',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    baseTicketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'showtimes',
  }
);

showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ movie: 1, auditorium: 1, startTime: 1 });

module.exports = mongoose.models.Showtime || mongoose.model('Showtime', showtimeSchema);

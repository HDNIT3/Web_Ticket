const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxLength: 1000,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'reviews'
  }
);

reviewSchema.index({ movie: 1, rating: -1 });
reviewSchema.index({ user: 1, booking: 1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);

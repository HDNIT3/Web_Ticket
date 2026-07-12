const mongoose = require('mongoose');
const { MovieStatus } = require('../enums');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 255,
    },
    description: {
      type: String,
      maxLength: 1000,
    },
    director: {
      type: String,
      maxLength: 255,
    },
    cast: {
      type: String,
      maxLength: 500,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    releaseDate: {
      type: Date,
    },
    posterUrl: {
      type: String,
      maxLength: 500,
    },
    trailerUrl: {
      type: String,
      maxLength: 500,
    },
    ageRating: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(MovieStatus),
      default: MovieStatus.COMING_SOON,
    },
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'movies',
  }
);

movieSchema.index({ status: 1, releaseDate: -1 });

module.exports = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
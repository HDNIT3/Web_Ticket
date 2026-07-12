const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 255,
    },
  },
  {
    timestamps: true,
    collection: 'genres',
  }
);

module.exports = mongoose.models.Genre || mongoose.model('Genre', genreSchema);
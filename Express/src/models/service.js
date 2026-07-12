const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: 255,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'services',
  }
);

serviceSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.models.Service || mongoose.model('Service', serviceSchema);


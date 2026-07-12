const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['PERCENT', 'AMOUNT'],
      default: 'PERCENT',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    minTicketRequired: {
      type: Number,
      min: 0,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxLength: 100,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxLength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'promotions',
  }
);

promotionSchema.index({ isActive: 1, startDate: -1, endDate: -1 });

module.exports = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);


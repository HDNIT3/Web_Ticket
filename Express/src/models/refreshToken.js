const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    legacyId:    { type: Number, index: true },
    RefreshToken:  { type: String, required: true },
    expires: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'refreshTokens'
  }
);

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
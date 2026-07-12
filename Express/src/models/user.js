const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    legacyId:    { type: Number, index: true },
    username:    { type: String, unique: true, sparse: true },
    email:       { type: String, unique: true, sparse: true },
    password:    { type: String },
    firstName:   { type: String },
    lastName:    { type: String },
    address:     { type: String },
    phoneNumber: { type: String, unique: true, sparse: true },
    gender:      { type: Boolean },
    image:       { type: String },
    role:        { type: String, enum: ['USER', 'ADMIN', 'STAFF'], default: 'USER' },
    positionId:  { type: String },
    status:        { type: String, enum: ['PENDING', 'ACTIVE', 'INACTIVE'], default: 'PENDING' },
    loyaltyPoints: { type: Number, default: 0 },
    lastLoginAt:   { type: Date, default: null },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
      }
    ],
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

const SPARSE_FIELDS = ['username', 'phoneNumber'];
userSchema.pre('save', function (next) {
  SPARSE_FIELDS.forEach((field) => {
    if (this[field] == null) this[field] = undefined;
  });
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const bookingExtraSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Booking', 
      required: true,
      index: true 
    },
    service: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Service', 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    totalPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    }
  },
  { timestamps: true, collection: 'booking_extras' }
);

module.exports = mongoose.models.BookingExtra || mongoose.model('BookingExtra', bookingExtraSchema);

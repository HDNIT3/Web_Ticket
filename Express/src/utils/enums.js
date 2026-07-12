const ENUMS = {
  AuditoriumStatus: ['ACTIVE', 'UNDER_MAINTENANCE', 'INACTIVE'],
  BookingStatus: ['PENDING', 'PENDING_APPROVAL', 'RESERVED', 'SUCCESS', 'CANCELLED', 'REFUNDED'],
  DiscountType: ['PERCENTAGE', 'FIXED_AMOUNT'],
  MovieStatus: ['NOW_SHOWING', 'COMING_SOON', 'STOPPED'],
  PaymentMethod: ['VNPAY', 'MOMO'],
  Role: ['ADMIN', 'USER'],
  SeatStatus: ['AVAILABLE', 'LOCKED', 'BOOKED'],
  ServiceCategory: ['FOOD', 'DRINK', 'COMBO', 'OTHER'],
  TicketStatus: ['PROCESSING', 'BOOKED', 'CANCELLED', 'USED'],
};

module.exports = ENUMS;

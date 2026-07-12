const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

// Thin controller delegating to BookingService
const BookingService = require('../services/BookingService');

const BookingController = {
  createBooking: async (req, res) => {
    try {
      const data = await BookingService.createBooking(req);
      return ok(res, data, 'Đặt vé thành công! Ghế của bạn sẽ được giữ trong 10 phút.', 201);
    } catch (e) {
      return fail(res, e.message);
    }
  },

  payBooking: async (req, res) => {
    try {
      const details = await BookingService.payBooking(req);
      return ok(res, details, 'Thanh toán đơn hàng thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  cancelBooking: async (req, res) => {
    try {
      await BookingService.cancelBooking(req);
      return ok(res, null, 'Hủy đơn hàng thành công! Ghế đã được giải phóng.');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  refundBooking: async (req, res) => {
    try {
      await BookingService.refundBooking(req);
      return ok(res, null, 'Hoàn tiền đơn hàng thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  getBookingDetails: async (req, res) => {
    try {
      const booking = await BookingService.getBookingDetails(req);
      return ok(res, booking, 'Lấy chi tiết đơn hàng thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  getMyBookings: async (req, res) => {
    try {
      const bookings = await BookingService.getMyBookings(req);
      return ok(res, bookings, 'Lấy lịch sử giao dịch thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  getAllBookings: async (req, res) => {
    try {
      const bookings = await BookingService.getAllBookings();
      return ok(res, bookings, 'Lấy toàn bộ đơn hàng thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },
  verifyTicket: async (req, res) => {
    try {
      const result = await BookingService.verifyTicket(req);
      return ok(res, result, 'Soát vé thành công! Vé hợp lệ.');
    } catch (e) {
      return fail(res, e.message);
    }
  },
  
  getStaffActivity: async (req, res) => {
    try {
      const data = await BookingService.getStaffActivity(req);
      return ok(res, data, 'Lấy lịch sử hoạt động nhân viên thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  },

  getWatchHistory: async (req, res) => {
    try {
      const data = await BookingService.getWatchHistory(req);
      return ok(res, data, 'Lấy lịch sử phim đã xem thành công!');
    } catch (e) {
      return fail(res, e.message);
    }
  }
};

module.exports = BookingController;

const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

const PaymentService = require('../services/PaymentService');
const Payment = require('../models/payment');
const Booking = require('../models/booking');

const PaymentController = {
  createPayment: async (req, res) => {
    try {
      const data = await PaymentService.createPaymentUrl(req);
      return ok(res, data, 'Tạo URL thanh toán thành công!', 201);
    } catch (e) {
      return fail(res, e.message, e.statusCode || 500);
    }
  }
  ,
  vnpayCallback: async (req, res) => {
    try {
      const result = await PaymentService.handleVnpayCallback(req);
      const data = {
        bookingId: result.bookingId || null,
        status: result.status || 'FAILED',
        email: result.email || null,
        number: result.number || null,
        message: result.message || null
      };
      return ok(res, data, result.message || 'Thanh toán qua VNPAY thành công');
    } catch (e) {
      const bookingId = req.query?.bookingId || req.body?.bookingId || null;
      return fail(res, e.message || 'Thanh toán qua VNPAY thất bại');
    }
  },

  momoIpn: async (req, res) => {
    try {
      const result = await PaymentService.handleMomoIpn(req);
      return res.json({ bookingId: result.bookingId || null, status: result.status || 'FAILED', email: result.email || null, number: result.number || null, message: result.message || null });
    } catch (e) {
      return res.json({ bookingId: null, status: 'FAILED', message: e.message });
    }
  },

  momoCallback: async (req, res) => {
    try {
      const result = await PaymentService.handleMomoReturn(req);
      const data = {
        bookingId: result.bookingId || null,
        status: result.status || 'FAILED',
        email: result.email || null,
        number: result.number || null,
        message: result.message || null
      };
      return ok(res, data, result.message || 'Thanh toán qua MOMO thành công');
    } catch (e) {
      const bookingId = req.query?.bookingId || req.body?.bookingId || null;
      return fail(res, e.message || 'Thanh toán qua MOMO thất bại');
    }
  },

  // Admin: lấy danh sách thanh toán
  getPayments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        method,
        status,
        q,
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      // Lọc booking theo status
      let bookingFilter = {};
      if (status) bookingFilter.status = status;

      // Lấy tất cả bookings (có populate payment, user, showtime, movie)
      let bookingQuery = Booking.find(bookingFilter)
        .populate('payment')
        .populate('user', 'firstName lastName email username')
        .populate({
          path: 'showtime',
          select: 'startTime',
          populate: { path: 'movie', select: 'title' }
        })
        .sort({ createdAt: -1 });

      const allBookings = await bookingQuery.exec();

      // Lọc theo payment method nếu có
      let filtered = allBookings;
      if (method) {
        filtered = filtered.filter(b => b.payment && b.payment.paymentMethod === method);
      }

      // Map bookings thành simulated payment items
      let paymentItems = filtered.map(b => {
        const p = b.payment;
        return {
          _id: p?._id || b._id,
          booking: b,
          paymentMethod: p?.paymentMethod || '-',
          paytime: p?.paytime || null,
          email: p?.email || null,
          number: p?.number || null,
          message: p?.message || (b.status === 'PENDING' ? 'Chờ thanh toán' : b.status === 'CANCELLED' ? 'Đã huỷ' : ''),
          createdAt: p?.createdAt || b.createdAt,
          updatedAt: p?.updatedAt || b.updatedAt
        };
      });

      // Filter keyword theo email/name booking hoặc tên phim
      if (q) {
        const kw = q.toLowerCase();
        paymentItems = paymentItems.filter(item => {
          const booking = item.booking;
          const user = booking?.user;
          const email = (user?.email || booking?.customerEmail || item.email || '').toLowerCase();
          const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase() || (booking?.customerName || '').toLowerCase();
          const movieTitle = (booking?.showtime?.movie?.title || '').toLowerCase();
          return email.includes(kw) || name.includes(kw) || movieTitle.includes(kw) || item.paymentMethod?.toLowerCase().includes(kw);
        });
      }

      const total = paymentItems.length;
      const paginated = paymentItems.slice(skip, skip + limitNum);

      return ok(res, {
        items: paginated,
        total,
        currentPage: pageNum,
        totalPage: Math.ceil(total / limitNum),
      }, 'Lấy danh sách thanh toán thành công!');
    } catch (e) {
      return fail(res, e.message || 'Lấy danh sách thanh toán thất bại.', 500);
    }
  },

  getPaymentById: async (req, res) => {
    try {
      let payment = await Payment.findById(req.params.id)
        .populate({
          path: 'booking',
          populate: [
            { path: 'user', select: 'firstName lastName email username phone' },
            { path: 'showtime', select: 'startTime', populate: { path: 'movie', select: 'title posterUrl' } },
            { path: 'tickets' },
          ]
        });

      if (!payment) {
        const booking = await Booking.findById(req.params.id)
          .populate('payment')
          .populate('user', 'firstName lastName email username phone')
          .populate({
            path: 'showtime',
            select: 'startTime',
            populate: { path: 'movie', select: 'title posterUrl' }
          })
          .populate('tickets');

        if (booking) {
          payment = {
            _id: booking.payment?._id || booking._id,
            booking: booking,
            paymentMethod: booking.payment?.paymentMethod || '-',
            paytime: booking.payment?.paytime || null,
            email: booking.payment?.email || null,
            number: booking.payment?.number || null,
            message: booking.payment?.message || (booking.status === 'PENDING' ? 'Chờ thanh toán' : booking.status === 'CANCELLED' ? 'Đã huỷ' : ''),
            createdAt: booking.payment?.createdAt || booking.createdAt,
            updatedAt: booking.payment?.updatedAt || booking.updatedAt
          };
        }
      }

      if (!payment) {
        return fail(res, 'Không tìm thấy thanh toán.', 404);
      }

      return ok(res, payment, 'Lấy chi tiết thanh toán thành công!');
    } catch (e) {
      return fail(res, e.message || 'Lấy chi tiết thanh toán thất bại.', 500);
    }
  },
};

module.exports = PaymentController;



// src/services/BookingService.js
// Service layer for all booking related business logic. Mirrors the functionality originally in BookingController.

const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Ticket = require('../models/ticket');
const BookingExtra = require('../models/bookingExtra');
const Payment = require('../models/payment');
const Showtime = require('../models/showtime');
const Seat = require('../models/seat');
const Service = require('../models/service');
const Promotion = require('../models/promotion');
const QRCode = require('qrcode');
const PointService = require('./PointService');

// Helper for error handling – service methods throw Error with meaningful message.
function throwError(message) {
  throw new Error(message);
}

const BookingService = {
  // 1. Create a new booking (holds seats for 10 minutes)
  async createBooking(req) {
    const { showtimeId, seatIds, services, promoCode, paymentMethod, bookingSource, customerName, customerPhone, customerEmail, usePoints } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const isStaffOrAdmin = userRole === 'STAFF' || userRole === 'ADMIN';
    const actualSource = (isStaffOrAdmin && bookingSource === 'COUNTER') ? 'COUNTER' : 'ONLINE';

    if (actualSource === 'COUNTER') {
      if (!customerName || !customerName.trim()) {
        throwError('Họ tên khách hàng tại quầy không được trống.');
      }
      if (!customerPhone || !customerPhone.trim()) {
        throwError('Số điện thoại khách hàng tại quầy không được trống.');
      }
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(customerPhone.trim())) {
        throwError('Số điện thoại khách hàng tại quầy không hợp lệ (Phải từ 10 đến 11 chữ số).');
      }
    }

    if (!showtimeId || !seatIds || seatIds.length === 0) {
      throwError('Suất chiếu và danh sách ghế không được trống.');
    }

    const showtime = await Showtime.findById(showtimeId).populate('auditorium');
    if (!showtime) throwError('Không tìm thấy suất chiếu.');

    // Check seat conflicts (excluding locks older than 10 minutes)
    const activeBookings = await Booking.find({ showtime: showtimeId, status: { $nin: ['CANCELLED', 'REFUNDED'] } }).distinct('_id');
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const conflictedTickets = await Ticket.find({
      booking: { $in: activeBookings },
      seat: { $in: seatIds },
      $or: [
        { status: 'PAID' },
        { status: 'CHECKED_IN' },
        { status: 'LOCKED', createdAt: { $gt: tenMinutesAgo } }
      ]
    }).populate('seat');
    if (conflictedTickets.length > 0) {
      const conflictedSeatNames = conflictedTickets.map(t => t.seat?.name).filter(Boolean).join(', ');
      throwError(`Ghế ${conflictedSeatNames} đã được khóa giữ chỗ bởi người dùng khác. Vui lòng chọn ghế khác.`);
    }

    // Seats and ticket price calculation
    const seats = await Seat.find({ _id: { $in: seatIds } }).populate('seatType');
    if (seats.length !== seatIds.length) throwError('Một số ghế không hợp lệ trong hệ thống.');

    let totalTicketAmount = 0;
    const ticketPrices = [];
    for (const seat of seats) {
      const surcharge = seat.seatType?.surchargeAmount || 0;
      const seatPrice = showtime.baseTicketPrice + surcharge;
      totalTicketAmount += seatPrice;
      ticketPrices.push({ seatId: seat._id, price: seatPrice });
    }

    // Services (popcorn, drink, etc.)
    let totalServiceAmount = 0;
    const extraDetails = [];
    if (services && services.length > 0) {
      for (const s of services) {
        const serviceItem = await Service.findById(s.serviceId);
        if (serviceItem) {
          const price = serviceItem.unitPrice * s.quantity;
          totalServiceAmount += price;
          extraDetails.push({ serviceId: serviceItem._id, quantity: s.quantity, totalPrice: price });
        }
      }
    }

    const subtotal = totalTicketAmount + totalServiceAmount;

    // Promotion handling
    let discountAmount = 0;
    let appliedPromotion = null;
    if (promoCode) {
      const promotion = await Promotion.findOne({ code: promoCode.toUpperCase(), isActive: true });
      if (promotion) {
        const now = new Date();
        const isDateValid = now >= new Date(promotion.startDate) && now <= new Date(promotion.endDate);
        const isQtyValid = promotion.quantity > 0;
        const isOrderValid = subtotal >= promotion.minOrderValue;
        const isTicketValid = seatIds.length >= promotion.minTicketRequired;
        // check user not used before (online or counter guest phone/email)
        const userOrGuestQueries = [{ user: userId }];
        if (customerPhone) userOrGuestQueries.push({ customerPhone });
        if (customerEmail) userOrGuestQueries.push({ customerEmail });

        const usedBookings = await Booking.find({
          $or: userOrGuestQueries,
          status: 'PAID'
        }).distinct('_id');
        const usedTicket = await Ticket.findOne({ booking: { $in: usedBookings }, 'promotion.promotionId': promotion._id });
        if (isDateValid && isQtyValid && isOrderValid && isTicketValid && !usedTicket) {
          appliedPromotion = promotion;
          if (promotion.discountType === 'PERCENT') {
            discountAmount = (subtotal * promotion.discountValue) / 100;
            if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
              discountAmount = promotion.maxDiscountAmount;
            }
          } else {
            discountAmount = promotion.discountValue;
          }
          if (discountAmount > subtotal) discountAmount = subtotal;
          // decrement remaining quantity
          promotion.quantity -= 1;
          await promotion.save();
        }
      }
    }

    const finalTotalAmount = Math.max(subtotal - discountAmount, 0);

    // Point redemption (chỉ dành cho ONLINE user, không dành cho quầy)
    const isCounter = actualSource === 'COUNTER' && paymentMethod === 'CASH';
    let pointDiscountAmount = 0;
    let pointsToRedeem = 0;
    if (!isCounter && usePoints && Number(usePoints) > 0) {
      const MAX_POINTS = 50;
      const POINT_VALUE = 1000;
      const User = require('../models/user');
      const userDoc = await User.findById(userId).select('loyaltyPoints');
      const availablePoints = userDoc?.loyaltyPoints || 0;
      pointsToRedeem = Math.min(Math.floor(Number(usePoints)), availablePoints, MAX_POINTS);
      pointDiscountAmount = pointsToRedeem * POINT_VALUE;
    }

    const grandTotalAmount = Math.max(finalTotalAmount - pointDiscountAmount, 0);

    const isPaidCounter = isCounter;

    // Create booking document
    const booking = new Booking({
      user: actualSource === 'ONLINE' ? userId : null,
      showtime: showtimeId,
      totalAmount: grandTotalAmount,
      status: isPaidCounter ? 'PAID' : 'PENDING',
      bookingSource: actualSource,
      createdBy: userId,
      pointsUsed: pointsToRedeem,
      customerName: actualSource === 'COUNTER' ? customerName : undefined,
      customerPhone: actualSource === 'COUNTER' ? customerPhone : undefined,
      customerEmail: actualSource === 'COUNTER' ? customerEmail : undefined
    });
    await booking.save();

    const discountPerTicket = seatIds.length > 0 ? (discountAmount + pointDiscountAmount) / seatIds.length : 0;

    // Create tickets with QR codes (initially LOCKED or PAID)
    const ticketDocs = [];
    for (const tp of ticketPrices) {
      const finalPrice = Math.max(tp.price - discountPerTicket, 0);
      const ticket = new Ticket({
        booking: booking._id,
        seat: tp.seatId,
        finalPrice,
        status: isPaidCounter ? 'PAID' : 'LOCKED',
        promotion: appliedPromotion ? { promotionId: appliedPromotion._id, discountAmount: discountPerTicket } : undefined
      });
      const qrData = JSON.stringify({ bookingId: booking._id.toString(), ticketId: ticket._id.toString(), status: isPaidCounter ? 'PAID' : 'LOCKED' });
      ticket.qrCodeUrl = await QRCode.toDataURL(qrData);
      await ticket.save();
      ticketDocs.push(ticket._id);
    }

    // Create booking extras (services)
    const extraDocs = [];
    for (const ed of extraDetails) {
      const extra = new BookingExtra({
        booking: booking._id,
        service: ed.serviceId,
        quantity: ed.quantity,
        totalPrice: ed.totalPrice
      });
      await extra.save();
      extraDocs.push(extra._id);
    }

    // Attach ticket and extra IDs to booking
    booking.tickets = ticketDocs;
    booking.bookingExtras = extraDocs;

    // If it's cash payment at counter, create payment record immediately
    if (isPaidCounter) {
      const payment = new Payment({
        booking: booking._id,
        paymentMethod: 'CASH',
        paytime: new Date(),
        message: 'Thanh toán tiền mặt trực tiếp tại quầy thành công.'
      });
      await payment.save();
      booking.payment = payment._id;
    }

    await booking.save();

    // Trừ điểm nếu user chọn dùng điểm (chỉ online)
    if (!isPaidCounter && pointsToRedeem > 0) {
      try {
        await PointService.redeemPoints(userId, pointsToRedeem);
      } catch (pointErr) {
        console.warn('[PointService] Lỗi trừ điểm:', pointErr.message);
      }
    }

    // Populate for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate({ path: 'showtime', populate: { path: 'movie' } })
      .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } })
      .populate({ path: 'bookingExtras', populate: { path: 'service' } })
      .populate('payment');

    // Send counter sale email invoice immediately
    if (isPaidCounter && customerEmail) {
      try {
        const EmailService = require('../services/EmailService');
        await EmailService.sendBookingInvoiceEmail(customerEmail, populatedBooking);
      } catch (err) {
        console.error('Error sending cash counter invoice email:', err);
      }
    }

    // Notify admins in realtime — chỉ khi đặt tại quầy (PAID ngay)
    // Đặt online sẽ notify ở payBooking sau khi thanh toán xong
    if (isPaidCounter) {
      try {
        const Notification = require('../models/notification');
        const { sendToAdmins } = require('../config/socket');
        const showtime = populatedBooking.showtime;
        const movieTitle = showtime?.movie?.title || 'Phim';
        const seatCount = populatedBooking.tickets?.length || 0;
        const notifTitle = 'Đặt vé mới (Quầy)';
        const notifContent = `Có đơn đặt vé tại quầy cho phim "${movieTitle}" (${seatCount} ghế) - Tổng: ${populatedBooking.totalAmount?.toLocaleString('vi-VN') || 0}đ`;

        const noti = await Notification.create({
          title: notifTitle,
          content: notifContent,
          type: 'BOOKING',
          targetAudience: 'ADMIN',
          relatedId: booking._id,
          onModel: 'Booking'
        });

        sendToAdmins('admin:notification', {
          _id: noti._id,
          title: notifTitle,
          content: notifContent,
          type: 'BOOKING',
          createdAt: noti.createdAt
        });
      } catch (notiErr) {
        console.warn('[NotificationService] Lỗi tạo thông báo booking quầy:', notiErr.message);
      }
    }

    return populatedBooking;
  },

  // 2. Complete payment
  async payBooking(req) {
    const { bookingId } = req.params;
    const { paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) throwError('Không tìm thấy đơn hàng.');
    if (booking.status === 'PAID') {
      return await Booking.findById(bookingId)
        .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] })
        .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } })
        .populate({ path: 'bookingExtras', populate: { path: 'service' } })
        .populate('payment')
        .populate('user');
    }
    if (booking.status === 'CANCELLED') throwError('Không thể thanh toán đơn hàng đã bị hủy.');

    booking.status = 'PAID';

    // Update tickets to PAID and refresh QR code
    const tickets = await Ticket.find({ booking: bookingId });
    for (const ticket of tickets) {
      ticket.status = 'PAID';
      const qrData = JSON.stringify({ bookingId: bookingId.toString(), ticketId: ticket._id.toString(), status: 'PAID' });
      ticket.qrCodeUrl = await QRCode.toDataURL(qrData);
      await ticket.save();
    }

    // Create payment record
    const payment = new Payment({
      booking: bookingId,
      paymentMethod: paymentMethod || 'VNPAY',
      paytime: new Date(),
      message: `Thanh toán thành công qua cổng ${paymentMethod || 'VNPAY'}`
    });
    await payment.save();

    booking.payment = payment._id;
    await booking.save();

    // Populate detailed booking for response
    const details = await Booking.findById(bookingId)
      .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] })
      .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } })
      .populate({ path: 'bookingExtras', populate: { path: 'service' } })
      .populate('payment')
      .populate('user');

    // Send invoice email
    const targetEmail = details.user?.email || details.customerEmail;
    if (targetEmail) {
      try {
        const EmailService = require('../services/EmailService');
        await EmailService.sendBookingInvoiceEmail(targetEmail, details);
      } catch (err) {
        console.error('Error sending invoice email:', err);
      }
    }

    // Notify admins in realtime after online payment confirmed
    try {
      const Notification = require('../models/notification');
      const { sendToAdmins, sendToUser } = require('../config/socket');
      const movieTitle = details.showtime?.movie?.title || 'Phim';
      const seatCount = details.tickets?.length || 0;
      const totalFmt = details.totalAmount?.toLocaleString('vi-VN') || 0;
      const method = paymentMethod || 'VNPAY';

      // 1. Thông báo cho Admin biết có đơn hàng mới thanh toán
      const adminNoti = await Notification.create({
        title: 'Đặt vé thành công',
        content: `Có đơn thanh toán mới cho phim "${movieTitle}" (${seatCount} ghế) qua ${method} - Tổng: ${totalFmt}đ`,
        type: 'BOOKING',
        targetAudience: 'ADMIN',
        relatedId: booking._id,
        onModel: 'Booking'
      });
      sendToAdmins('admin:notification', {
        _id: adminNoti._id,
        title: adminNoti.title,
        content: adminNoti.content,
        type: 'BOOKING',
        createdAt: adminNoti.createdAt
      });

      // 2. Thông báo xác nhận cho chính user đặt vé (nếu là online user)
      if (details.user?._id) {
        const userId = details.user._id.toString();
        const userNoti = await Notification.create({
          title: 'Đặt vé thành công 🎉',
          content: `Bạn đã đặt thành công ${seatCount} vé phim "${movieTitle}". Tổng tiền: ${totalFmt}đ. Vui lòng kiểm tra email để xem chi tiết.`,
          type: 'BOOKING',
          targetAudience: 'SINGLE',
          userId: details.user._id,
          relatedId: booking._id,
          onModel: 'Booking'
        });
        sendToUser(userId, 'notification', {
          _id: userNoti._id,
          title: userNoti.title,
          content: userNoti.content,
          type: 'BOOKING',
          createdAt: userNoti.createdAt
        });
      }
    } catch (notiErr) {
      console.warn('[NotificationService] Lỗi tạo thông báo payBooking:', notiErr.message);
    }

    return details;
  },

  // 3. Cancel booking (release seats)
  async cancelBooking(req) {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) throwError('Không tìm thấy đơn hàng.');
    if (booking.status === 'PAID') throwError('Không thể hủy đơn hàng đã thanh toán.');

    booking.status = 'CANCELLED';
    await booking.save();

    await Ticket.updateMany({ booking: bookingId }, { status: 'CANCELLED' });

    const firstTicket = await Ticket.findOne({ booking: bookingId });
    if (firstTicket && firstTicket.promotion?.promotionId) {
      await Promotion.findByIdAndUpdate(firstTicket.promotion.promotionId, { $inc: { quantity: 1 } });
    }

    if (booking.user && booking.pointsUsed > 0) {
      try {
        await PointService.restorePoints(booking.user.toString(), booking.pointsUsed);
      } catch (pointErr) {
        console.warn('[PointService] Lỗi hoàn điểm khi hủy booking:', pointErr.message);
      }
    }
  },

  // 3.5. Refund booking (release seats and mark status as REFUNDED)
  async refundBooking(req) {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) throwError('Không tìm thấy đơn hàng.');
    if (booking.status !== 'PAID') throwError('Chỉ có thể hoàn tiền cho đơn hàng đã thanh toán.');

    // Ensure refund is requested at least 12 hours before showtime starts
    const showtime = await Showtime.findById(booking.showtime);
    if (showtime) {
      const twelveHoursInMs = 12 * 60 * 60 * 1000;
      const timeDiff = new Date(showtime.startTime).getTime() - Date.now();
      if (timeDiff < twelveHoursInMs) {
        throwError('Chỉ có thể hoàn tiền trước khi suất chiếu bắt đầu ít nhất 12 tiếng.');
      }
    }

    booking.status = 'REFUNDED';
    await booking.save();

    await Ticket.updateMany({ booking: bookingId }, { status: 'REFUNDED' });

    // Restore promotion quantity if used
    const firstTicket = await Ticket.findOne({ booking: bookingId });
    if (firstTicket && firstTicket.promotion?.promotionId) {
      await Promotion.findByIdAndUpdate(firstTicket.promotion.promotionId, { $inc: { quantity: 1 } });
    }

    // Hoàn điểm tích lũy nếu user đã dùng điểm
    if (booking.user && booking.pointsUsed > 0) {
      try {
        await PointService.restorePoints(booking.user.toString(), booking.pointsUsed);
      } catch (pointErr) {
        console.warn('[PointService] Lỗi hoàn điểm khi refund booking:', pointErr.message);
      }
    }

    return null;
  },

  // 4. Get booking details
  async getBookingDetails(req) {
    const booking = await Booking.findById(req.params.bookingId)
      .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] })
      .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } })
      .populate({ path: 'bookingExtras', populate: { path: 'service' } })
      .populate('payment')
      .populate('user', 'username firstName lastName email');
    if (!booking) throwError('Không tìm thấy đơn hàng.');
    return booking;
  },

  // 5. Get bookings of current user
  async getMyBookings(req) {
    const bookings = await Booking.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] })
      .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } })
      .populate({ path: 'bookingExtras', populate: { path: 'service' } });
    return bookings;
  },

  // 6. Get all bookings (admin)
  async getAllBookings() {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email')
      .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] });
    return bookings;
  },

  // 7. Verify QR ticket (staff)
  async verifyTicket(req) {
    const { qrData } = req.body;
    if (!qrData) throwError('Dữ liệu mã QR không được trống.');

    let bookingId, ticketId;
    try {
      const parsed = JSON.parse(qrData);
      bookingId = parsed.bookingId;
      ticketId = parsed.ticketId;
    } catch (e) {
      // Hỗ trợ trường hợp quét mã QR thô chứa ID vé được sinh từ API dự phòng
      const cleanData = qrData.trim();
      const isValidObjectId = mongoose.Types.ObjectId.isValid(cleanData);
      if (isValidObjectId) {
        ticketId = cleanData;
      } else {
        throwError('Mã QR không hợp lệ (Sai định dạng dữ liệu).');
      }
    }

    if (!ticketId) throwError('Mã QR thiếu thông tin vé.');

    const ticket = await Ticket.findById(ticketId).populate('seat');
    if (!ticket) throwError('Không tìm thấy vé trong hệ thống.');

    const actualBookingId = bookingId || ticket.booking.toString();
    if (ticket.booking.toString() !== actualBookingId) {
      throwError('Vé không khớp với đơn đặt vé tương ứng.');
    }

    const booking = await Booking.findById(actualBookingId)
      .populate('user', 'firstName lastName email')
      .populate({ path: 'showtime', populate: { path: 'movie' } });
    if (!booking) throwError('Không tìm thấy đơn đặt vé tương ứng.');
    if (booking.status === 'REFUNDED') throwError('Đơn hàng này đã hoàn tiền (REFUNDED). Vé không còn hiệu lực.');
    if (booking.status !== 'PAID') throwError(`Đơn hàng này đang ở trạng thái "${booking.status}", chưa được thanh toán thành công.`);

    // Kiểm tra xem suất chiếu đã kết thúc chưa
    const showtime = booking.showtime;
    if (showtime) {
      const now = new Date();
      const duration = showtime.movie?.durationMinutes || 120;
      const endTime = showtime.endTime
        ? new Date(showtime.endTime)
        : new Date(new Date(showtime.startTime).getTime() + duration * 60 * 1000);

      if (now > endTime) {
        throwError('Suất chiếu của bộ phim này đã kết thúc. Không thể soát vé!');
      }
    }

    if (ticket.status === 'CHECKED_IN') {
      const fmt = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(ticket.checkedInAt);
      throwError(`Vé này đã được soát cổng trước đó vào lúc ${fmt}. Không thể tái sử dụng!`);
    }
    if (ticket.status === 'CANCELLED') throwError('Vé này đã bị hủy bỏ trước đó.');
    if (ticket.status === 'REFUNDED') throwError('Vé này đã được hoàn tiền trước đó.');

    // Mark as checked in and refresh QR
    ticket.status = 'CHECKED_IN';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = req.user.id;
    const updatedQr = JSON.stringify({ bookingId, ticketId, status: 'CHECKED_IN' });
    ticket.qrCodeUrl = await QRCode.toDataURL(updatedQr);
    await ticket.save();

    return {
      ticket: {
        id: ticket._id,
        seatName: ticket.seat?.name,
        finalPrice: ticket.finalPrice,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt
      },
      booking: {
        id: booking._id,
        buyerName: booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() : (booking.customerName || 'Khách vãng lai'),
        buyerEmail: booking.user?.email || booking.customerEmail || 'N/A',
        movieTitle: booking.showtime?.movie?.title,
        startTime: booking.showtime?.startTime
      }
    };
  },

  async getStaffActivity(req) {
    const staffId = req.user.id;

    const bookings = await Booking.find({ createdBy: staffId, bookingSource: 'COUNTER' })
      .sort({ createdAt: -1 })
      .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'auditorium' }] })
      .populate({ path: 'tickets', populate: { path: 'seat' } })
      .populate({ path: 'bookingExtras', populate: { path: 'service' } })
      .populate('payment')
      .populate('user', 'firstName lastName email');

    const tickets = await Ticket.find({ checkedInBy: staffId, status: 'CHECKED_IN' })
      .sort({ checkedInAt: -1 })
      .populate({ path: 'seat' })
      .populate({
        path: 'booking',
        populate: [
          { path: 'user', select: 'firstName lastName email' },
          { path: 'showtime', populate: { path: 'movie' } }
        ]
      });

    return { bookings, tickets };
  },

  async getWatchHistory(req) {
    const userId = req.user.id;
    const now = new Date();

    const bookings = await Booking.find({ user: userId, status: 'PAID' })
      .sort({ createdAt: -1 })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', populate: { path: 'genres', select: '_id name' } },
          { path: 'auditorium' }
        ]
      })
      .populate({ path: 'tickets', populate: { path: 'seat', populate: { path: 'seatType' } } });

    const watchedBookings = bookings.filter((booking) => {
      const showtime = booking.showtime;
      if (!showtime || !showtime.startTime) return false;

      const durationMinutes = showtime.movie?.durationMinutes || 120;
      const endTime = new Date(showtime.startTime).getTime() + durationMinutes * 60 * 1000;
      const showtimeEnded = now.getTime() > endTime;
      const hasCheckedIn = booking.tickets?.some((t) => t.status === 'CHECKED_IN');

      return showtimeEnded && hasCheckedIn;
    });

    return watchedBookings;
  }
};

module.exports = BookingService;


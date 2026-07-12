const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/bookingController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.post('/', jwtAuth, BookingController.createBooking);
router.post('/:bookingId/pay', jwtAuth, BookingController.payBooking);
router.post('/:bookingId/cancel', jwtAuth, BookingController.cancelBooking);
router.post('/:bookingId/refund', jwtAuth, BookingController.refundBooking);
router.get('/my', jwtAuth, BookingController.getMyBookings);
router.get('/watch-history', jwtAuth, BookingController.getWatchHistory);
router.get('/all', jwtAuth, authorize(['ADMIN', 'STAFF']), BookingController.getAllBookings);
router.get('/staff-activity', jwtAuth, authorize(['ADMIN', 'STAFF']), BookingController.getStaffActivity);
router.post('/verify-ticket', jwtAuth, authorize(['ADMIN', 'STAFF']), BookingController.verifyTicket);
router.get('/:bookingId', jwtAuth, BookingController.getBookingDetails);

module.exports = router;

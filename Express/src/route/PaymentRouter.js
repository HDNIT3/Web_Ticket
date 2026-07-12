const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const jwtAuth = require('../middleware/jwtAuth');

router.post('/', jwtAuth, PaymentController.createPayment);

router.get('/vnpay/callback', PaymentController.vnpayCallback);
router.post('/vnpay/callback', PaymentController.vnpayCallback);

router.post('/momo/ipn', PaymentController.momoIpn); // server-to-server notification
router.get('/momo/callback', PaymentController.momoCallback); // redirect/return
router.post('/momo/callback', PaymentController.momoCallback); // redirect/return

// Admin: lấy danh sách thanh toán
router.get('/list', jwtAuth, PaymentController.getPayments);
router.get('/list/:id', jwtAuth, PaymentController.getPaymentById);

module.exports = router;




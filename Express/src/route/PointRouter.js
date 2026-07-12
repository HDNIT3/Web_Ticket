const express = require('express');
const router = express.Router();

const PointController = require('../controllers/PointController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

// User kiểm tra điểm tại trang thanh toán
router.get('/balance', jwtAuth, PointController.getPointsBalance);

// User tự xem điểm của mình
router.get('/my', jwtAuth, PointController.getMyPoints);

// Admin: Danh sách tất cả user kèm điểm
router.get('/admin/users', jwtAuth, authorize(['ADMIN']), PointController.getAllUsersPoints);

// Admin: Chi tiết lịch sử điểm của một user
router.get('/admin/users/:userId', jwtAuth, authorize(['ADMIN']), PointController.getUserPointsById);

module.exports = router;

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.use(jwtAuth);

router.get('/', NotificationController.getNotifications);
router.put('/read-all', NotificationController.readAllNotifications);
router.put('/:id/read', NotificationController.readNotification);
router.get('/user/list', NotificationController.getUserNotifications);
router.patch('/user/:id/read', NotificationController.markBroadcastRead);

router.get('/admin/list', authorize(['ADMIN', 'STAFF']), NotificationController.getAdminNotifications);
router.patch('/admin/read-all', authorize(['ADMIN', 'STAFF']), NotificationController.markAllAdminRead);
router.patch('/admin/:id/read', authorize(['ADMIN', 'STAFF']), NotificationController.markOneRead);
router.get('/admin/broadcasts', authorize(['ADMIN', 'STAFF']), NotificationController.getAdminBroadcasts);
router.get('/admin/users/search', authorize(['ADMIN', 'STAFF']), NotificationController.searchUserByEmail);
router.post('/admin/broadcast', authorize(['ADMIN', 'STAFF']), NotificationController.createBroadcast);
router.put('/admin/broadcast/:id', authorize(['ADMIN', 'STAFF']), NotificationController.updateBroadcast);
router.delete('/admin/broadcast/:id', authorize(['ADMIN', 'STAFF']), NotificationController.deleteBroadcast);

module.exports = router;

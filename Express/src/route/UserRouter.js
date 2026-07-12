const express = require('express');
const router = express.Router();

const UserController = require('../controllers/UserController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');
const { validateEditProfile } = require('../middleware/Validation');

router.get('/getProfile', jwtAuth, UserController.getProfile);
router.put('/profile', jwtAuth, validateEditProfile, UserController.updateProfile);

// Admin routes
router.get('/admin/list', jwtAuth, authorize(['ADMIN']), UserController.getUsersByAdmin);
router.put('/admin/:id', jwtAuth, authorize(['ADMIN']), UserController.updateUserByAdmin);

module.exports = router;
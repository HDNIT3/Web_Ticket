const express = require('express');
const router = express.Router();
const seatTypeController = require('../controllers/seatTypeController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.get('/', seatTypeController.getAllSeatTypes);
router.post('/', jwtAuth, authorize(['ADMIN', 'STAFF']), seatTypeController.createSeatType);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), seatTypeController.updateSeatType);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), seatTypeController.deleteSeatType);

module.exports = router;

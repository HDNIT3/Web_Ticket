const express = require('express');
const router = express.Router();
const ShowtimeController = require('../controllers/ShowtimeController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.get('/', ShowtimeController.getShowtimes);

router.get('/:id', ShowtimeController.getShowtimeById);

router.post('/', jwtAuth, authorize(['ADMIN', 'STAFF']), ShowtimeController.createShowtime);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), ShowtimeController.updateShowtime);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), ShowtimeController.deleteShowtime);

module.exports = router;

const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.post('/generate/:auditoriumId', jwtAuth, authorize(['ADMIN', 'STAFF']), seatController.generateSeatsForAuditorium);
router.get('/', seatController.getAllSeats);
router.get('/auditorium/:auditoriumId', seatController.getSeatsByAuditorium);
router.get('/showtime/:showtimeId', seatController.getSeatsForShowtime);
router.get('/:id', seatController.getSeatById);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), seatController.updateSeat);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), seatController.deleteSeat);

module.exports = router;

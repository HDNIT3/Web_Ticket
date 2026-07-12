const express = require('express');
const router = express.Router();
const auditoriumController = require('../controllers/auditoriumController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.post('/', jwtAuth, authorize(['ADMIN', 'STAFF']), auditoriumController.createAuditorium);
router.get('/', auditoriumController.getAllAuditoriums);
router.get('/:id', auditoriumController.getAuditoriumById);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), auditoriumController.updateAuditorium);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), auditoriumController.deleteAuditorium);

module.exports = router;

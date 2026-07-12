const express = require('express');
const router = express.Router();

const ServiceController = require('../controllers/ServiceController');
const jwtAuth = require('../middleware/jwtAuth');
const adminAuth = require('../middleware/AdminAuth');
const { validateCreateService, validateUpdateService } = require('../middleware/Validation');

router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getServiceById);
router.post('/', jwtAuth, adminAuth, validateCreateService, ServiceController.createService);
router.put('/:id', jwtAuth, adminAuth, validateUpdateService, ServiceController.updateService);
router.delete('/:id', jwtAuth, adminAuth, ServiceController.deleteService);

module.exports = router;


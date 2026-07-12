const express = require('express');
const router = express.Router();

const PromotionController = require('../controllers/PromotionController');
const jwtAuth = require('../middleware/jwtAuth');
const adminAuth = require('../middleware/AdminAuth');
const { validateCreatePromotion, validateUpdatePromotion } = require('../middleware/Validation');

router.get('/', PromotionController.getPromotions);
router.get('/:id', PromotionController.getPromotionById);
router.post('/validate', jwtAuth, PromotionController.validatePromoCode);
router.post('/', jwtAuth, adminAuth, validateCreatePromotion, PromotionController.createPromotion);
router.put('/:id', jwtAuth, adminAuth, validateUpdatePromotion, PromotionController.updatePromotion);
router.delete('/:id', jwtAuth, adminAuth, PromotionController.deletePromotion);

module.exports = router;


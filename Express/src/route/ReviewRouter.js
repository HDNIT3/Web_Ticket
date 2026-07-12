const express = require('express');
const router = express.Router();

const ReviewController = require('../controllers/ReviewController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');

router.post('/', jwtAuth, ReviewController.createReview);
router.put('/:reviewId', jwtAuth, ReviewController.updateReview);
router.delete('/:reviewId', jwtAuth, ReviewController.deleteReview);
router.get('/my', jwtAuth, ReviewController.getMyReviews);

router.get('/movie/:movieId', ReviewController.getMovieReviewsAndStats);

router.get('/admin', jwtAuth, authorize(['ADMIN', 'STAFF']), ReviewController.getAdminReviews);
router.get('/admin/stats', jwtAuth, authorize(['ADMIN', 'STAFF']), ReviewController.getAdminStats);

module.exports = router;

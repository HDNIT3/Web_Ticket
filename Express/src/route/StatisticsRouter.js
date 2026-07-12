const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/jwtAuth');
const adminAuth = require('../middleware/AdminAuth');
const StatisticsController = require('../controllers/StatisticsController');

router.use(jwtAuth);
router.use(adminAuth);

router.get('/overview', StatisticsController.overview);
router.get('/revenue', StatisticsController.revenue);
router.get('/tickets', StatisticsController.tickets);
router.get('/users', StatisticsController.users);
router.get('/top-movies-favorite', StatisticsController.topMoviesFavorite);
router.get('/top-movies-tickets', StatisticsController.topMoviesTickets);

module.exports = router;

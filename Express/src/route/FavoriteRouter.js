const express = require('express');
const router = express.Router();
const FavoriteController = require('../controllers/FavoriteController');
const jwtAuth = require('../middleware/jwtAuth');

router.get('/', jwtAuth, FavoriteController.getMyFavorites);
router.get('/check/:movieId', jwtAuth, FavoriteController.checkFavorite);
router.post('/:movieId', jwtAuth, FavoriteController.addFavorite);
router.delete('/:movieId', jwtAuth, FavoriteController.removeFavorite);

module.exports = router;

const express = require('express');
const router = express.Router();

const MovieController = require('../controllers/MovieController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');
const { validateCreateMovie, validateUpdateMovie } = require('../middleware/Validation');

router.get('/', MovieController.getMovies);
router.get('/:id/similar', MovieController.getSimilarMovies);
router.get('/:id', MovieController.getMovieById);
router.post('/', jwtAuth, authorize(['ADMIN', 'STAFF']), validateCreateMovie, MovieController.createMovie);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), validateUpdateMovie, MovieController.updateMovie);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), MovieController.deleteMovie);

module.exports = router;
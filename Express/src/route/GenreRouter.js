const express = require('express');
const router = express.Router();

const GenreController = require('../controllers/GenreController');
const jwtAuth = require('../middleware/jwtAuth');
const authorize = require('../middleware/RoleAuth');
const { validateCreateGenre, validateUpdateGenre } = require('../middleware/Validation');

router.get('/', GenreController.getGenres);
router.get('/:id', GenreController.getGenreById);
router.post('/', jwtAuth, authorize(['ADMIN', 'STAFF']), validateCreateGenre, GenreController.createGenre);
router.put('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), validateUpdateGenre, GenreController.updateGenre);
router.delete('/:id', jwtAuth, authorize(['ADMIN', 'STAFF']), GenreController.deleteGenre);

module.exports = router;
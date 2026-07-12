const mongoose = require('mongoose');
const Genre = require('../models/genre');
const Movie = require('../models/movie');

const GenreService = {
    createGenre: async (dto) => {
        const exists = await Genre.findOne({ name: dto.name });
        if (exists) {
            const error = new Error('Tên thể loại đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }

        return Genre.create({ name: dto.name });
    },

    getGenres: async () => {
        const genres = await Genre.aggregate([
            {
                $lookup: {
                    from: 'movies',
                    localField: '_id',
                    foreignField: 'genres',
                    as: 'movies',
                },
            },
            {
                $addFields: {
                    movieCount: { $size: '$movies' },
                },
            },
            {
                $project: {
                    movies: 0,
                },
            },
            {
                $sort: { name: 1 },
            },
        ]);

        return genres;
    },

    getGenreById: async (genreId) => {
        if (!mongoose.Types.ObjectId.isValid(genreId)) {
            const error = new Error('ID thể loại không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        const genre = await Genre.findById(genreId);
        if (!genre) {
            const error = new Error('Không tìm thấy thể loại.');
            error.statusCode = 404;
            throw error;
        }

        return genre;
    },

    updateGenre: async (genreId, dto) => {
        const genre = await GenreService.getGenreById(genreId);

        if (dto.name && dto.name !== genre.name) {
            const exists = await Genre.findOne({ name: dto.name, _id: { $ne: genre._id } });
            if (exists) {
                const error = new Error('Tên thể loại đã tồn tại.');
                error.statusCode = 409;
                throw error;
            }

            genre.name = dto.name;
        }

        await genre.save();
        return genre;
    },

    deleteGenre: async (genreId) => {
        const genre = await GenreService.getGenreById(genreId);
        await Movie.updateMany({ genres: genre._id }, { $pull: { genres: genre._id } });
        await Genre.deleteOne({ _id: genre._id });
    },
};

module.exports = GenreService;
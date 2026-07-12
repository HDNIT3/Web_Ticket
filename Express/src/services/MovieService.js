const mongoose = require('mongoose');
const Movie = require('../models/movie');
const Genre = require('../models/genre');

const { MovieStatus } = require('../enums');
const VALID_STATUSES = Object.values(MovieStatus);
const MovieService = {
    ensureGenreIdsExist: async (genreIds = []) => {
        const normalizedIds = Array.from(new Set((Array.isArray(genreIds) ? genreIds : []).map((genreId) => `${genreId}`.trim()).filter(Boolean)));

        if (!normalizedIds.length) {
            return [];
        }

        const existingGenres = await Genre.find({ _id: { $in: normalizedIds } }).select('_id').lean();
        if (existingGenres.length !== normalizedIds.length) {
            const error = new Error('Một hoặc nhiều thể loại không tồn tại.');
            error.statusCode = 400;
            throw error;
        }

        return normalizedIds;
    },

    buildFilter: (query = {}) => {
        const filter = {};

        if (query.title) {
            const keyword = `${query.title}`.trim();
            if (keyword) {
                filter.title = { $regex: keyword, $options: 'i' };
            }
        }

        if (query.q) {
            const keyword = `${query.q}`.trim();
            if (keyword) {
                filter.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { director: { $regex: keyword, $options: 'i' } },
                    { cast: { $regex: keyword, $options: 'i' } },
                ];
            }
        }

        if (query.status) {
            const status = `${query.status}`.trim().toUpperCase();
            if (VALID_STATUSES.includes(status)) {
                filter.status = status;
            } else {
                const error = new Error('Trạng thái phim không hợp lệ.');
                error.statusCode = 400;
                throw error;
            }
        }

        if (query.genreId) {
            if (!mongoose.Types.ObjectId.isValid(query.genreId)) {
                const error = new Error('ID thể loại không hợp lệ.');
                error.statusCode = 400;
                throw error;
            }

            filter.genres = { $in: [new mongoose.Types.ObjectId(query.genreId)] };
        }

        if (query.ageRating) {
            filter.ageRating = `${query.ageRating}`.trim();
        }

        if (query.releaseYear) {
            const year = Number(query.releaseYear);
            if (Number.isNaN(year) || year < 1900) {
                const error = new Error('Năm khởi chiếu không hợp lệ.');
                error.statusCode = 400;
                throw error;
            }

            filter.releaseDate = {
                $gte: new Date(`${year}-01-01T00:00:00.000Z`),
                $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
            };
        }

        return filter;
    },

    getMovies: async (query = {}) => {
        const filter = MovieService.buildFilter(query);
        const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
        const sizeParam = typeof query.limit !== 'undefined' ? query.limit : query.size;
        const limit = Math.min(Math.max(Number.parseInt(sizeParam, 10) || 10, 1), 100);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Movie.find(filter)
                .sort({ releaseDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('genres', '_id name')
                .lean(),
            Movie.countDocuments(filter),
        ]);

        return {
            currentPage: page,
            currentItem: items,
            totalPage: Math.max(Math.ceil(total / limit), 1),
        };
    },

    getMovieById: async (movieId) => {
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            const error = new Error('ID phim không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        const movie = await Movie.findById(movieId).populate('genres', '_id name');
        if (!movie) {
            const error = new Error('Không tìm thấy phim.');
            error.statusCode = 404;
            throw error;
        }

        return movie;
    },

    createMovie: async (dto) => {
        const duplicate = await Movie.findOne({ title: dto.title });
        if (duplicate) {
            const error = new Error('Tên phim đã tồn tại.');
            error.statusCode = 409;
            throw error;
        }

        const genres = await MovieService.ensureGenreIdsExist(dto.genres);

        const createdMovie = await Movie.create({
            title: dto.title,
            description: dto.description || undefined,
            director: dto.director || undefined,
            cast: dto.cast || undefined,
            durationMinutes: dto.durationMinutes,
            releaseDate: dto.releaseDate && !Number.isNaN(dto.releaseDate.getTime()) ? dto.releaseDate : undefined,
            posterUrl: dto.posterUrl || undefined,
            trailerUrl: dto.trailerUrl || undefined,
            ageRating: dto.ageRating,
            status: dto.status,
            genres,
        });

        // Trigger thông báo realtime & email
        const Notification = require('../models/notification');
        const User = require('../models/user');
        const socketManager = require('../config/socket');
        const EmailService = require('./EmailService');

        Notification.create({
            title: 'Phim mới ra mắt! 🎬',
            content: `Bộ phim "${createdMovie.title}" đã được thêm vào hệ thống. Xem ngay!`,
            type: 'NEW_MOVIE',
            relatedId: createdMovie._id,
            onModel: 'Movie'
        }).then((notification) => {
            // Gửi qua WebSocket
            socketManager.sendToAll('notification', notification);

            // Gửi Email bất đồng bộ
            process.nextTick(async () => {
                try {
                    const activeUsers = await User.find({ status: 'ACTIVE', email: { $exists: true } }).select('email');
                    for (const u of activeUsers) {
                        EmailService.sendNewMovieNotification(u.email, createdMovie).catch(err => 
                            console.error(`Lỗi gửi mail phim mới cho ${u.email}:`, err)
                        );
                    }
                } catch (err) {
                    console.error('Lỗi lấy danh sách user để gửi mail phim mới:', err);
                }
            });
        }).catch((err) => {
            console.error('Lỗi tạo thông báo phim mới:', err);
        });

        return MovieService.getMovieById(createdMovie._id);
    },

    updateMovie: async (movieId, dto) => {
        const movie = await MovieService.getMovieById(movieId);

        if (typeof dto.title !== 'undefined' && dto.title !== movie.title) {
            const duplicate = await Movie.findOne({ title: dto.title, _id: { $ne: movie._id } });
            if (duplicate) {
                const error = new Error('Tên phim đã tồn tại.');
                error.statusCode = 409;
                throw error;
            }

            movie.title = dto.title;
        }

        if (typeof dto.description !== 'undefined') movie.description = dto.description || undefined;
        if (typeof dto.director !== 'undefined') movie.director = dto.director || undefined;
        if (typeof dto.cast !== 'undefined') movie.cast = dto.cast || undefined;
        if (typeof dto.durationMinutes !== 'undefined') movie.durationMinutes = dto.durationMinutes;
        if (typeof dto.releaseDate !== 'undefined') movie.releaseDate = dto.releaseDate && !Number.isNaN(dto.releaseDate.getTime()) ? dto.releaseDate : undefined;
        if (typeof dto.posterUrl !== 'undefined') movie.posterUrl = dto.posterUrl || undefined;
        if (typeof dto.trailerUrl !== 'undefined') movie.trailerUrl = dto.trailerUrl || undefined;
        if (typeof dto.ageRating !== 'undefined') movie.ageRating = dto.ageRating;
        if (typeof dto.status !== 'undefined') movie.status = dto.status;
        if (typeof dto.genres !== 'undefined') movie.genres = await MovieService.ensureGenreIdsExist(dto.genres);

        await movie.save();
        return MovieService.getMovieById(movie._id);
    },

    deleteMovie: async (movieId) => {
        const movie = await MovieService.getMovieById(movieId);
        await Movie.deleteOne({ _id: movie._id });
        
        // Cascade delete related showtimes
        const Showtime = require('../models/showtime');
        await Showtime.deleteMany({ movie: movie._id });
        
        return movie;
    },

    getSimilarMovies: async (movieId, limit = 8) => {
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            const error = new Error('ID phim không hợp lệ.');
            error.statusCode = 400;
            throw error;
        }

        const movie = await Movie.findById(movieId).select('genres status').lean();
        if (!movie) {
            const error = new Error('Không tìm thấy phim.');
            error.statusCode = 404;
            throw error;
        }

        if (!movie.genres || movie.genres.length === 0) return [];

        const similar = await Movie.find({
            _id: { $ne: new mongoose.Types.ObjectId(movieId) },
            genres: { $in: movie.genres },
        })
            .sort({ releaseDate: -1, createdAt: -1 })
            .limit(limit)
            .populate('genres', '_id name')
            .lean();

        return similar;
    },
};

module.exports = MovieService;
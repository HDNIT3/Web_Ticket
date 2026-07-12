const express = require('express');
const router = express.Router();
const authRouter = require('./AuthRouter');
const userRouter = require('./UserRouter');
const movieRouter = require('./MovieRouter');
const genreRouter = require('./GenreRouter');
const showtimeRouter = require('./ShowtimeRouter');
const auditoriumRouter = require('./AuditoriumRouter');
const seatRouter = require('./SeatRouter');
const promotionRouter = require('./PromotionRouter');
const serviceRouter = require('./ServiceRouter');
const initWebRoute = (app) => {
    router.get('/', (req, res) => {
        return res.json({ success: true, message: 'Movie App API đang hoạt động.' });
    });

    app.use('/auth', authRouter);
    app.use('/user', userRouter);
    app.use('/movies', movieRouter);
    app.use('/genres', genreRouter);
    app.use('/showtimes', showtimeRouter);
    app.use('/auditoriums', auditoriumRouter);
    app.use('/seats', seatRouter);
    const seatTypeRouter = require('./SeatTypeRouter');
    app.use('/seat-types', seatTypeRouter);

    app.use('/promotions', promotionRouter);

    app.use('/services', serviceRouter);

    const bookingRouter = require('./BookingRouter');
    app.use('/bookings', bookingRouter);
    const paymentRouter = require('./PaymentRouter');
    app.use('/api/payment', paymentRouter);
    const reviewRouter = require('./ReviewRouter');
    app.use('/reviews', reviewRouter);
    const pointRouter = require('./PointRouter');
    app.use('/points', pointRouter);

    const favoriteRouter = require('./FavoriteRouter');
    app.use('/favorites', favoriteRouter);

    const notificationRouter = require('./NotificationRouter');
    app.use('/notifications', notificationRouter);

    const statisticsRouter = require('./StatisticsRouter');
    app.use('/statistics', statisticsRouter);

    const chatbotRouter = require('./ChatbotRouter');
    app.use('/chatbot', chatbotRouter);

    app.use('/', router);
};

module.exports = initWebRoute;
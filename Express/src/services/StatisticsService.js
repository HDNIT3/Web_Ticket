const Booking = require('../models/booking');
const Ticket = require('../models/ticket');
const User = require('../models/user');

function groupByPeriod(period, field = '$createdAt') {
    if (period === 'year') {
        return {
            groupId: { year: { $year: field } },
            labelExpr: { $toString: { $year: field } },
        };
    }
    if (period === 'month') {
        return {
            groupId: { year: { $year: field }, month: { $month: field } },
            labelExpr: {
                $concat: [
                    { $toString: { $year: field } },
                    '-',
                    {
                        $cond: [
                            { $lt: [{ $month: field }, 10] },
                            { $concat: ['0', { $toString: { $month: field } }] },
                            { $toString: { $month: field } },
                        ],
                    },
                ],
            },
        };
    }
    return {
        groupId: { year: { $year: field }, month: { $month: field }, day: { $dayOfMonth: field } },
        labelExpr: { $dateToString: { format: '%Y-%m-%d', date: field } },
    };
}

function buildDateFilter(from, to) {
    if (!from && !to) return null;
    const filter = {};
    if (from) filter.$gte = new Date(from);
    if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.$lte = end;
    }
    return filter;
}

const StatisticsService = {
    getOverview: async () => {
        const [revenueResult, totalTickets, totalUsers] = await Promise.all([
            Booking.aggregate([
                { $match: { status: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ]),
            Ticket.countDocuments({ status: { $in: ['PAID', 'CHECKED_IN'] } }),
            User.countDocuments({ role: 'USER', status: 'ACTIVE' }),
        ]);
        return {
            totalRevenue: revenueResult[0]?.total || 0,
            totalBookings: revenueResult[0]?.count || 0,
            totalTicketsSold: totalTickets,
            totalActiveUsers: totalUsers,
        };
    },

    getRevenue: async ({ period = 'month', from, to } = {}) => {
        const match = { status: 'PAID' };
        const dateFilter = buildDateFilter(from, to);
        if (dateFilter) match.createdAt = dateFilter;

        const { groupId, labelExpr } = groupByPeriod(period);

        const items = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupId,
                    totalRevenue: { $sum: '$totalAmount' },
                    bookingCount: { $sum: 1 },
                    label: { $first: labelExpr },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $project: { _id: 0, label: 1, totalRevenue: 1, bookingCount: 1 } },
        ]);

        return {
            period,
            items,
            totalRevenue: items.reduce((s, r) => s + r.totalRevenue, 0),
            totalBookings: items.reduce((s, r) => s + r.bookingCount, 0),
        };
    },

    getTickets: async ({ period = 'month', from, to } = {}) => {
        const match = { status: { $in: ['PAID', 'CHECKED_IN'] } };
        const dateFilter = buildDateFilter(from, to);
        if (dateFilter) match.createdAt = dateFilter;

        const { groupId, labelExpr } = groupByPeriod(period);

        const items = await Ticket.aggregate([
            { $match: match },
            {
                $group: {
                    _id: groupId,
                    ticketCount: { $sum: 1 },
                    totalRevenue: { $sum: '$finalPrice' },
                    label: { $first: labelExpr },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $project: { _id: 0, label: 1, ticketCount: 1, totalRevenue: 1 } },
        ]);

        return {
            period,
            items,
            totalTickets: items.reduce((s, r) => s + r.ticketCount, 0),
        };
    },

    getUsers: async ({ period = 'month', from, to } = {}) => {
        const dateFilter = buildDateFilter(from, to);

        const registerMatch = { role: 'USER' };
        if (dateFilter) registerMatch.createdAt = dateFilter;

        const { groupId, labelExpr } = groupByPeriod(period);

        const registerItems = await User.aggregate([
            { $match: registerMatch },
            {
                $group: {
                    _id: groupId,
                    newUsers: { $sum: 1 },
                    label: { $first: labelExpr },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $project: { _id: 0, label: 1, newUsers: 1 } },
        ]);

        const loginMatch = { role: 'USER', lastLoginAt: { $exists: true, $ne: null } };
        if (dateFilter) loginMatch.lastLoginAt = { ...loginMatch.lastLoginAt, ...dateFilter };

        const { groupId: loginGroupId, labelExpr: loginLabelExpr } = groupByPeriod(period, '$lastLoginAt');

        const loginItems = await User.aggregate([
            { $match: loginMatch },
            {
                $group: {
                    _id: loginGroupId,
                    loginCount: { $sum: 1 },
                    label: { $first: loginLabelExpr },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            { $project: { _id: 0, label: 1, loginCount: 1 } },
        ]);

        return {
            period,
            registerItems,
            loginItems,
            totalNewUsers: registerItems.reduce((s, r) => s + r.newUsers, 0),
            totalLogins: loginItems.reduce((s, r) => s + r.loginCount, 0),
        };
    },

    getTopMoviesFavorite: async ({ limit = 10 } = {}) => {
        return User.aggregate([
            { $match: { favorites: { $exists: true, $not: { $size: 0 } } } },
            { $unwind: '$favorites' },
            { $group: { _id: '$favorites', favoriteCount: { $sum: 1 } } },
            { $sort: { favoriteCount: -1 } },
            { $limit: Number(limit) },
            { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
            { $unwind: { path: '$movie', preserveNullAndEmptyArrays: false } },
            { $lookup: { from: 'reviews', localField: '_id', foreignField: 'movie', as: 'reviews' } },
            {
                $project: {
                    _id: 0,
                    movieId: '$_id',
                    title: '$movie.title',
                    posterUrl: '$movie.posterUrl',
                    status: '$movie.status',
                    releaseDate: '$movie.releaseDate',
                    favoriteCount: 1,
                    avgRating: {
                        $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, { $avg: '$reviews.rating' }, 0],
                    },
                    reviewCount: { $size: '$reviews' },
                },
            },
        ]);
    },

    getTopMoviesTickets: async ({ limit = 10, from, to } = {}) => {
        const match = { status: { $in: ['PAID', 'CHECKED_IN'] } };
        const dateFilter = buildDateFilter(from, to);
        if (dateFilter) match.createdAt = dateFilter;

        return Ticket.aggregate([
            { $match: match },
            { $lookup: { from: 'bookings', localField: 'booking', foreignField: '_id', as: 'bookingData' } },
            { $unwind: '$bookingData' },
            { $lookup: { from: 'showtimes', localField: 'bookingData.showtime', foreignField: '_id', as: 'showtimeData' } },
            { $unwind: '$showtimeData' },
            {
                $group: {
                    _id: '$showtimeData.movie',
                    ticketCount: { $sum: 1 },
                    totalRevenue: { $sum: '$finalPrice' },
                },
            },
            { $sort: { ticketCount: -1 } },
            { $limit: Number(limit) },
            { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
            { $unwind: { path: '$movie', preserveNullAndEmptyArrays: false } },
            { $lookup: { from: 'reviews', localField: '_id', foreignField: 'movie', as: 'reviews' } },
            {
                $project: {
                    _id: 0,
                    movieId: '$_id',
                    title: '$movie.title',
                    posterUrl: '$movie.posterUrl',
                    status: '$movie.status',
                    releaseDate: '$movie.releaseDate',
                    ticketCount: 1,
                    totalRevenue: 1,
                    avgRating: {
                        $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, { $avg: '$reviews.rating' }, 0],
                    },
                    reviewCount: { $size: '$reviews' },
                },
            },
        ]);
    },
};

module.exports = StatisticsService;

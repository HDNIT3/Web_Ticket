const StatisticsService = require('../services/StatisticsService');

const ok = (res, data, message) => res.status(200).json({ success: true, message, data });
const fail = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const StatisticsController = {
    overview: async (req, res) => {
        try {
            const data = await StatisticsService.getOverview();
            return ok(res, data, 'Tổng quan thành công.');
        } catch (e) { return fail(res, e); }
    },

    revenue: async (req, res) => {
        try {
            const data = await StatisticsService.getRevenue(req.query);
            return ok(res, data, 'Thống kê doanh thu thành công.');
        } catch (e) { return fail(res, e); }
    },

    tickets: async (req, res) => {
        try {
            const data = await StatisticsService.getTickets(req.query);
            return ok(res, data, 'Thống kê vé thành công.');
        } catch (e) { return fail(res, e); }
    },

    users: async (req, res) => {
        try {
            const data = await StatisticsService.getUsers(req.query);
            return ok(res, data, 'Thống kê người dùng thành công.');
        } catch (e) { return fail(res, e); }
    },

    topMoviesFavorite: async (req, res) => {
        try {
            const data = await StatisticsService.getTopMoviesFavorite(req.query);
            return ok(res, data, 'Top phim yêu thích thành công.');
        } catch (e) { return fail(res, e); }
    },

    topMoviesTickets: async (req, res) => {
        try {
            const data = await StatisticsService.getTopMoviesTickets(req.query);
            return ok(res, data, 'Top phim bán vé thành công.');
        } catch (e) { return fail(res, e); }
    },
};

module.exports = StatisticsController;

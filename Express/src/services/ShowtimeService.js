const mongoose = require('mongoose');
const Showtime = require('../models/showtime');
const Movie = require('../models/movie');
const Auditorium = require('../models/auditorium');
const pricingStrategyContext = require('../strategies/pricing');

const ShowtimeService = {
  _requireValidId(id, label = 'ID') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error(`${label} không hợp lệ.`);
      err.statusCode = 400;
      throw err;
    }
  },

  _requireMovie: async (movieId) => {
    const movie = await Movie.findById(movieId).select('_id durationMinutes status').lean();
    if (!movie) {
      const err = new Error('Không tìm thấy phim.');
      err.statusCode = 404;
      throw err;
    }
    if (movie.status === 'STOPPED') {
      const err = new Error('Không thể thêm suất chiếu cho phim đang ngưng chiếu.');
      err.statusCode = 400;
      throw err;
    }
    return movie;
  },

  _checkOverlap: async (auditoriumId, newStart, newEnd, excludeShowtimeId = null) => {
    const dayStart = new Date(newStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(newStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const existingShowtimes = await Showtime.find({
      auditorium: auditoriumId,
      startTime: { $gte: dayStart, $lt: dayEnd }
    }).populate('movie', 'durationMinutes').lean();
    
    for (const st of existingShowtimes) {
      if (excludeShowtimeId && String(st._id) === String(excludeShowtimeId)) continue;
      
      const stStart = new Date(st.startTime);
      const stEnd = st.endTime ? new Date(st.endTime) : new Date(stStart.getTime() + ((st.movie?.durationMinutes || 120) + 15) * 60000);
      
      if (newStart < stEnd && newEnd > stStart) {
        const err = new Error('Phòng chiếu đã có lịch chiếu bị trùng lặp trong khoảng thời gian này.');
        err.statusCode = 409;
        throw err;
      }
    }
  },

  _requireAuditorium: async (auditoriumId) => {
    const auditorium = await Auditorium.findById(auditoriumId).select('_id name').lean();
    if (!auditorium) {
      const err = new Error('Không tìm thấy phòng chiếu.');
      err.statusCode = 404;
      throw err;
    }
    return auditorium;
  },

  buildFilter: async (query = {}) => {
    const filter = {};

    if (query.movieId) {
      ShowtimeService._requireValidId(query.movieId, 'Movie ID');
      filter.movie = query.movieId;
    }

    if (query.date) {
      const day = new Date(query.date);
      if (Number.isNaN(day.getTime())) {
        const err = new Error('Ngày không hợp lệ. Vui lòng dùng định dạng YYYY-MM-DD.');
        err.statusCode = 400;
        throw err;
      }
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.startTime = { $gte: day, $lt: nextDay };
    }

    if (query.upcoming === 'true') {
      filter.startTime = { ...(filter.startTime || {}), $gte: new Date() };
    }

    return filter;
  },

  getShowtimes: async (query = {}) => {
    const filter = await ShowtimeService.buildFilter(query);
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 2000);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Showtime.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate('movie', '_id title posterUrl durationMinutes')
        .populate('auditorium', '_id name seatCount')
        .lean(),
      Showtime.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    };
  },

  getShowtimeById: async (id) => {
    ShowtimeService._requireValidId(id, 'Showtime ID');
    const showtime = await Showtime.findById(id)
      .populate('movie', '_id title posterUrl durationMinutes')
      .populate('auditorium', '_id name seatCount totalRows totalColumns')
      .lean();
    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu.');
      err.statusCode = 404;
      throw err;
    }
    return showtime;
  },

  createShowtime: async (dto) => {
    ShowtimeService._requireValidId(dto.movie, 'Movie ID');
    const movieDoc = await ShowtimeService._requireMovie(dto.movie);
    
    ShowtimeService._requireValidId(dto.auditorium, 'Auditorium ID');
    await ShowtimeService._requireAuditorium(dto.auditorium);

    const startTime = new Date(dto.startTime);
    if (Number.isNaN(startTime.getTime())) {
      const err = new Error('startTime không hợp lệ.');
      err.statusCode = 400;
      throw err;
    }

    let endTime;
    if (dto.endTime) {
      endTime = new Date(dto.endTime);
      if (Number.isNaN(endTime.getTime())) {
        const err = new Error('endTime không hợp lệ.');
        err.statusCode = 400;
        throw err;
      }
    } else {
      const duration = movieDoc.durationMinutes || 120;
      endTime = new Date(startTime.getTime() + (duration + 15) * 60000);
    }
    
    await ShowtimeService._checkOverlap(dto.auditorium, startTime, endTime);

    const standardPrice = dto.baseTicketPrice || 50000;

    const created = await Showtime.create({
      movie: dto.movie,
      auditorium: dto.auditorium,
      startTime,
      endTime,
      baseTicketPrice: pricingStrategyContext.getPrice(standardPrice, startTime),
    });

    // Trigger thông báo cho những ai thích bộ phim này
    const User = require('../models/user');
    const Notification = require('../models/notification');
    const socketManager = require('../config/socket');
    const EmailService = require('./EmailService');

    Movie.findById(created.movie).select('title genres').lean().then((movieDoc) => {
      if (movieDoc) {
        User.find({ favorites: created.movie, status: 'ACTIVE' }).select('_id email').lean().then((fans) => {
          if (fans && fans.length > 0) {
            process.nextTick(async () => {
              const room = await Auditorium.findById(created.auditorium).select('name').lean();
              const fullShowtime = { ...created.toObject(), auditorium: room };
              
              for (const fan of fans) {
                try {
                  const userNoti = await Notification.create({
                    userId: fan._id,
                    title: '🔥 Lịch chiếu mới phim yêu thích!',
                    content: `Phim "${movieDoc.title}" bạn thích vừa có lịch chiếu mới. Đặt vé ngay!`,
                    type: 'NEW_SHOWTIME',
                    relatedId: created._id,
                    onModel: 'Showtime'
                  });

                  // Gửi WebSocket
                  socketManager.sendToUser(fan._id, 'notification', userNoti);

                  // Gửi Email
                  if (fan.email) {
                    EmailService.sendNewShowtimeNotification(fan.email, movieDoc, fullShowtime).catch(err => 
                      console.error(`Lỗi gửi mail lịch chiếu mới cho fan ${fan.email}:`, err)
                    );
                  }
                } catch (fanErr) {
                  console.error(`Lỗi thông báo lịch chiếu cho fan ${fan._id}:`, fanErr);
                }
              }
            });
          }
        }).catch(err => console.error('Lỗi tìm fans:', err));
      }
    }).catch(err => console.error('Lỗi tìm phim:', err));

    return ShowtimeService.getShowtimeById(created._id);
  },

  updateShowtime: async (id, dto) => {
    const showtime = await Showtime.findById(id);
    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu.');
      err.statusCode = 404;
      throw err;
    }

    if (typeof dto.movie !== 'undefined') {
      ShowtimeService._requireValidId(dto.movie, 'Movie ID');
      await ShowtimeService._requireMovie(dto.movie);
      showtime.movie = dto.movie;
    }
    
    if (typeof dto.auditorium !== 'undefined') {
      ShowtimeService._requireValidId(dto.auditorium, 'Auditorium ID');
      await ShowtimeService._requireAuditorium(dto.auditorium);
      showtime.auditorium = dto.auditorium;
    }
    
    if (typeof dto.startTime !== 'undefined') showtime.startTime = new Date(dto.startTime);
    if (typeof dto.endTime !== 'undefined') showtime.endTime = dto.endTime ? new Date(dto.endTime) : undefined;
    
    if (typeof dto.baseTicketPrice !== 'undefined' || typeof dto.startTime !== 'undefined') {
      const standardPrice = typeof dto.baseTicketPrice !== 'undefined' ? dto.baseTicketPrice : 50000;
      showtime.baseTicketPrice = pricingStrategyContext.getPrice(standardPrice, showtime.startTime);
    }

    const currentMovieDoc = await Movie.findById(showtime.movie).select('durationMinutes').lean();
    const duration = currentMovieDoc?.durationMinutes || 120;
    const computedEnd = showtime.endTime ? new Date(showtime.endTime) : new Date(new Date(showtime.startTime).getTime() + (duration + 15) * 60000);
    await ShowtimeService._checkOverlap(showtime.auditorium, new Date(showtime.startTime), computedEnd, showtime._id);

    await showtime.save();
    return ShowtimeService.getShowtimeById(showtime._id);
  },

  deleteShowtime: async (id) => {
    ShowtimeService._requireValidId(id, 'Showtime ID');
    const showtime = await Showtime.findByIdAndDelete(id).lean();
    if (!showtime) {
      const err = new Error('Không tìm thấy suất chiếu.');
      err.statusCode = 404;
      throw err;
    }
    return showtime;
  },
};

module.exports = ShowtimeService;

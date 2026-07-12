const mongoose = require('mongoose');
const Review = require('../models/review');
const Booking = require('../models/booking');
const Ticket = require('../models/ticket');
const Movie = require('../models/movie');
const PointService = require('./PointService');

function throwError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

const ReviewService = {
  async createReview(userId, dto) {
    const { bookingId, rating, comment } = dto;

    if (!bookingId) {
      throwError('Mã đặt vé không được trống.');
    }
    if (!rating || rating < 1 || rating > 5) {
      throwError('Điểm đánh giá phải từ 1 đến 5 sao.');
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'showtime',
      populate: { path: 'movie' }
    });

    if (!booking) {
      throwError('Không tìm thấy đơn đặt vé.', 404);
    }

    if (!booking.user || booking.user.toString() !== userId) {
      throwError('Bạn không có quyền đánh giá đơn đặt vé này.', 403);
    }

    if (booking.status !== 'PAID') {
      throwError('Đơn đặt vé chưa được thanh toán thành công.');
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      throwError('Đơn đặt vé này đã được đánh giá trước đó.');
    }

    const showtime = booking.showtime;
    if (!showtime) {
      throwError('Không tìm thấy thông tin suất chiếu của đơn đặt vé.');
    }

    const duration = showtime.movie?.durationMinutes || 120;
    const startTime = new Date(showtime.startTime);
    const endTime = new Date(startTime.getTime() + (duration + 15) * 60 * 1000);
    
    if (new Date() < endTime) {
      throwError('Suất chiếu chưa kết thúc. Bạn chỉ có thể đánh giá sau khi đã xem xong phim.');
    }

    const hasCheckedInTicket = await Ticket.findOne({
      booking: bookingId,
      status: 'CHECKED_IN'
    });

    if (!hasCheckedInTicket) {
      throwError('Vé của bạn chưa được soát tại quầy/cửa. Bạn cần sử dụng vé để thực hiện đánh giá.');
    }

    const review = new Review({
      booking: bookingId,
      movie: showtime.movie._id,
      user: userId,
      showtime: showtime._id,
      rating,
      comment: comment || ''
    });

    await review.save();

    try {
      await PointService.awardFirstReviewPoints(
        userId,
        showtime.movie._id,
        showtime.movie.title || '',
        showtime._id
      );
    } catch (pointErr) {
      console.warn('[PointService] Lỗi tích điểm (review vẫn thành công):', pointErr.message);
    }

    // Notify admins in realtime
    try {
      const Notification = require('../models/notification');
      const { sendToAdmins } = require('../config/socket');
      const movieTitle = showtime.movie?.title || 'Phim';
      const notifTitle = 'Đánh giá phim mới';
      const notifContent = `Có đánh giá mới cho phim "${movieTitle}" - ${rating} sao${comment ? `: "${comment.slice(0, 60)}${comment.length > 60 ? '...' : ''}"` : ''}`;

      const noti = await Notification.create({
        title: notifTitle,
        content: notifContent,
        type: 'REVIEW',
        targetAudience: 'ADMIN',
        relatedId: review._id,
        onModel: 'Review'
      });

      sendToAdmins('admin:notification', {
        _id: noti._id,
        title: notifTitle,
        content: notifContent,
        type: 'REVIEW',
        createdAt: noti.createdAt
      });
    } catch (notiErr) {
      console.warn('[NotificationService] Lỗi tạo thông báo review:', notiErr.message);
    }

    return await Review.findById(review._id)
      .populate('user', 'username firstName lastName image')
      .populate({
        path: 'showtime',
        populate: { path: 'auditorium', select: 'name' }
      });
  },

  async updateReview(reviewId, userId, dto) {
    const { rating, comment } = dto;

    if (!rating || rating < 1 || rating > 5) {
      throwError('Điểm đánh giá phải từ 1 đến 5 sao.');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throwError('Không tìm thấy đánh giá.', 404);
    }

    if (review.user.toString() !== userId) {
      throwError('Bạn không có quyền chỉnh sửa đánh giá này.', 403);
    }

    review.rating = rating;
    review.comment = comment || '';
    await review.save();

    return await Review.findById(review._id)
      .populate('user', 'username firstName lastName image')
      .populate({
        path: 'showtime',
        populate: { path: 'auditorium', select: 'name' }
      });
  },

  async deleteReview(reviewId, userId, userRole) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throwError('Không tìm thấy đánh giá.', 404);
    }

    const isAuthor = review.user.toString() === userId;
    const isModerator = ['ADMIN', 'STAFF'].includes(userRole);

    if (!isAuthor && !isModerator) {
      throwError('Bạn không có quyền xóa đánh giá này.', 403);
    }

    await Review.deleteOne({ _id: reviewId });
    return review;
  },

  async getMyReviews(userId) {
    return await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'showtime',
        populate: { path: 'movie', select: 'title posterUrl' }
      })
      .lean();
  },

  async getMovieReviewsAndStats(movieId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      throwError('ID phim không hợp lệ.');
    }

    const statsResult = await Review.aggregate([
      { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
      {
        $group: {
          _id: '$movie',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = statsResult.length > 0 ? Math.round(statsResult[0].averageRating * 10) / 10 : 0;
    const totalReviews = statsResult.length > 0 ? statsResult[0].totalReviews : 0;

    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { movie: new mongoose.Types.ObjectId(movieId) };

    if (query.rating) {
      const ratingFilter = Number.parseInt(query.rating, 10);
      if (ratingFilter >= 1 && ratingFilter <= 5) {
        filter.rating = ratingFilter;
      }
    }

    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username firstName lastName image')
        .populate({
          path: 'showtime',
          populate: { path: 'auditorium', select: 'name' }
        })
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      averageRating,
      totalReviews,
      reviews: {
        currentPage: page,
        currentItem: items,
        totalPage: Math.max(Math.ceil(total / limit), 1),
        totalItems: total
      }
    };
  },

  async getAdminReviews(query = {}) {
    const filter = {};

    if (query.movieId) {
      if (mongoose.Types.ObjectId.isValid(query.movieId)) {
        filter.movie = new mongoose.Types.ObjectId(query.movieId);
      } else {
        throwError('ID phim không hợp lệ.');
      }
    }

    if (query.rating) {
      const ratingFilter = Number.parseInt(query.rating, 10);
      if (ratingFilter >= 1 && ratingFilter <= 5) {
        filter.rating = ratingFilter;
      }
    }

    if (query.q) {
      const keyword = `${query.q}`.trim();
      if (keyword) {
        const matchingMovies = await Movie.find({
          title: { $regex: keyword, $options: 'i' }
        }).distinct('_id');

        const User = require('../models/user');
        const matchingUsers = await User.find({
          $or: [
            { username: { $regex: keyword, $options: 'i' } },
            { firstName: { $regex: keyword, $options: 'i' } },
            { lastName: { $regex: keyword, $options: 'i' } }
          ]
        }).distinct('_id');

        filter.$or = [
          { comment: { $regex: keyword, $options: 'i' } },
          { movie: { $in: matchingMovies } },
          { user: { $in: matchingUsers } }
        ];
      }
    }

    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username firstName lastName email')
        .populate('movie', 'title posterUrl')
        .populate({
          path: 'showtime',
          populate: { path: 'auditorium', select: 'name' }
        })
        .lean(),
      Review.countDocuments(filter),
    ]);

    return {
      currentPage: page,
      currentItem: items,
      totalPage: Math.max(Math.ceil(total / limit), 1),
      totalItems: total
    };
  },

  async getAdminStats(query = {}) {
    const filter = {};

    if (query.movieId && mongoose.Types.ObjectId.isValid(query.movieId)) {
      filter.movie = new mongoose.Types.ObjectId(query.movieId);
    }

    const aggregateResult = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let sumRatings = 0;

    aggregateResult.forEach(item => {
      const rating = item._id;
      const count = item.count;
      if (rating >= 1 && rating <= 5) {
        breakdown[rating] = count;
        totalReviews += count;
        sumRatings += (rating * count);
      }
    });

    const averageRating = totalReviews > 0 ? Math.round((sumRatings / totalReviews) * 10) / 10 : 0;

    return {
      totalReviews,
      averageRating,
      breakdown
    };
  }
};

module.exports = ReviewService;

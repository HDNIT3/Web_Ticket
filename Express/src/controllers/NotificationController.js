const Notification = require('../models/notification');
const User = require('../models/user');
const { sendToAll, sendToAdmins, sendToUser } = require('../config/socket');

const ok = (res, data, message, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const fail = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message, data: null });

const NotificationController = {
  getNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      // Chỉ lấy thông báo gửi riêng cho user (SINGLE) hoặc broadcast cho tất cả (ALL)
      // Không lấy thông báo dành cho ADMIN
      const list = await Notification.find({
        $or: [
          { userId, targetAudience: 'SINGLE' },
          { userId: null, targetAudience: 'ALL' }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const formattedList = list.map((noti) => ({
        _id: noti._id,
        title: noti.title,
        content: noti.content,
        type: noti.type,
        relatedId: noti.relatedId,
        onModel: noti.onModel,
        isRead: noti.userId ? noti.isRead : noti.readBy.includes(userId),
        createdAt: noti.createdAt
      }));

      return res.status(200).json({ success: true, message: 'Lấy danh sách thông báo thành công', data: formattedList });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  readNotification: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const noti = await Notification.findById(id);
      if (!noti) return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });

      if (noti.userId) {
        noti.isRead = true;
      } else if (!noti.readBy.includes(userId)) {
        noti.readBy.push(userId);
      }
      await noti.save();

      return res.status(200).json({ success: true, message: 'Đã đánh dấu đọc thông báo' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  readAllNotifications: async (req, res) => {
    try {
      const userId = req.user.id;
      await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
      const unreadGlobals = await Notification.find({ userId: null, readBy: { $ne: userId } });
      for (const n of unreadGlobals) {
        n.readBy.push(userId);
        await n.save();
      }
      return res.status(200).json({ success: true, message: 'Đã đánh dấu đọc tất cả thông báo' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getAdminNotifications: async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const skip = (page - 1) * limit;
      const { q } = req.query;

      let filter = { targetAudience: 'ADMIN', type: { $in: ['BOOKING', 'REVIEW'] } };

      if (q && q.trim()) {
        const keyword = q.trim();
        const users = await User.find({
          $or: [
            { email: new RegExp(keyword, 'i') },
            { username: new RegExp(keyword, 'i') }
          ]
        }).select('_id');
        const userIds = users.map(u => u._id);

        const Booking = require('../models/booking');
        const bookings = await Booking.find({
          $or: [
            { user: { $in: userIds } },
            { customerEmail: new RegExp(keyword, 'i') }
          ]
        }).select('_id');
        const bookingIds = bookings.map(b => b._id);

        const Review = require('../models/review');
        const reviews = await Review.find({ user: { $in: userIds } }).select('_id');
        const reviewIds = reviews.map(r => r._id);

        filter.$or = [
          { relatedId: { $in: bookingIds }, onModel: 'Booking' },
          { relatedId: { $in: reviewIds }, onModel: 'Review' },
          { title: new RegExp(keyword, 'i') },
          { content: new RegExp(keyword, 'i') }
        ];
      }

      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, readBy: { $ne: req.user.id } })
      ]);

      return ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1, unreadCount }, 'Lấy thông báo admin thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  markAllAdminRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { targetAudience: 'ADMIN', type: { $in: ['BOOKING', 'REVIEW'] }, readBy: { $ne: req.user.id } },
        { $addToSet: { readBy: req.user.id } }
      );
      return ok(res, null, 'Đã đánh dấu tất cả đã đọc.');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  markOneRead: async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user.id } });
      return ok(res, null, 'Đã đánh dấu đã đọc.');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  getAdminBroadcasts: async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 15, 50);
      const skip = (page - 1) * limit;
      const filter = { type: 'BROADCAST' };

      const [items, total] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('sentBy', 'username firstName lastName email')
          .populate('userId', 'email firstName lastName username')
          .lean(),
        Notification.countDocuments(filter)
      ]);

      return ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1 }, 'Lấy lịch sử broadcast thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  createBroadcast: async (req, res) => {
    try {
      const { title, content, targetEmail } = req.body;
      if (!title?.trim()) return fail(res, 'Tiêu đề không được trống.');
      if (!content?.trim()) return fail(res, 'Nội dung không được trống.');

      // Nếu có nhập email → gửi riêng cho user đó
      if (targetEmail?.trim()) {
        const targetUser = await User.findOne({ email: targetEmail.trim().toLowerCase() }).select('_id email firstName lastName username role');
        if (!targetUser) return fail(res, `Không tìm thấy người dùng với email "${targetEmail}".`, 404);

        const notification = new Notification({
          title: title.trim(),
          content: content.trim(),
          type: 'BROADCAST',
          targetAudience: 'SINGLE',
          userId: targetUser._id,
          sentBy: req.user.id
        });
        await notification.save();
        await notification.populate('sentBy', 'username firstName lastName');

        sendToUser(targetUser._id.toString(), 'notification', {
          _id: notification._id,
          title: notification.title,
          content: notification.content,
          type: 'BROADCAST',
          createdAt: notification.createdAt
        });

        const recipientName = targetUser.firstName
          ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim()
          : targetUser.username || targetUser.email;
        return ok(res, { ...notification.toObject(), recipientName }, `Đã gửi thông báo đến ${recipientName} (${targetUser.email})!`, 201);
      }

      // Không có email → broadcast đến tất cả
      const notification = new Notification({
        title: title.trim(),
        content: content.trim(),
        type: 'BROADCAST',
        targetAudience: 'ALL',
        sentBy: req.user.id
      });
      await notification.save();
      await notification.populate('sentBy', 'username firstName lastName');

      sendToAll('notification', {
        _id: notification._id,
        title: notification.title,
        content: notification.content,
        type: 'BROADCAST',
        createdAt: notification.createdAt
      });

      return ok(res, notification, 'Đã gửi thông báo đến toàn bộ người dùng!', 201);
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  searchUserByEmail: async (req, res) => {
    try {
      const { email } = req.query;
      if (!email?.trim()) return fail(res, 'Vui lòng nhập email cần tìm.');
      const user = await User.findOne({ email: email.trim().toLowerCase() }).select('_id email firstName lastName username role');
      if (!user) return fail(res, 'Không tìm thấy người dùng với email này.', 404);
      return ok(res, user, 'Tìm thấy người dùng.');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },
  
  updateBroadcast: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      if (!title?.trim()) return fail(res, 'Tiêu đề không được trống.');
      if (!content?.trim()) return fail(res, 'Nội dung không được trống.');

      const notification = await Notification.findOneAndUpdate(
        { _id: id, type: 'BROADCAST' },
        { title: title.trim(), content: content.trim(), readBy: [] },
        { new: true }
      ).populate('sentBy', 'username firstName lastName email');

      if (!notification) {
        return fail(res, 'Không tìm thấy broadcast hoặc không có quyền chỉnh sửa.', 404);
      }

      sendToAll('notification', {
        _id: notification._id,
        title: notification.title,
        content: notification.content,
        type: 'BROADCAST',
        createdAt: notification.createdAt
      });

      return ok(res, notification, 'Cập nhật broadcast thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  deleteBroadcast: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findOneAndDelete({ _id: id, type: 'BROADCAST' });
      if (!notification) {
        return fail(res, 'Không tìm thấy broadcast để xóa.', 404);
      }
      return ok(res, null, 'Xóa broadcast thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  getUserNotifications: async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 15, 50);
      const skip = (page - 1) * limit;
      const filter = { type: 'BROADCAST', targetAudience: 'ALL' };

      const [items, total, unreadCount] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ ...filter, readBy: { $ne: req.user.id } })
      ]);

      return ok(res, { items, total, page, totalPages: Math.ceil(total / limit) || 1, unreadCount }, 'Lấy thông báo thành công!');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  },

  markBroadcastRead: async (req, res) => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user.id } });
      return ok(res, null, 'Đã đánh dấu đã đọc.');
    } catch (err) {
      return fail(res, err.message || 'Lỗi server.', 500);
    }
  }
};

module.exports = NotificationController;

const User = require('../models/user');
const UserResponseDto = require('../dtos/response/UserResponseDto');

const UserService = {
    getProfile: async (userId) => {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            const err = new Error('Người dùng không tồn tại.');
            err.statusCode = 404;
            throw err;
        }
        return UserResponseDto.fromUser(user);
    },
    updateProfile: async (userId, dto) => {
        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('Người dùng không tồn tại.');
            err.statusCode = 404;
            throw err;
        }

        if (dto.phoneNumber !== undefined && dto.phoneNumber !== user.phoneNumber) {
            const existed = await User.findOne({
                phoneNumber: dto.phoneNumber,
                _id: { $ne: userId }
            });
            if (existed) {
                const err = new Error('Số điện thoại đã được sử dụng.');
                err.statusCode = 409;
                throw err;
            }
        }

        const update = {};
        if (dto.firstName !== undefined) update.firstName = dto.firstName;
        if (dto.lastName !== undefined) update.lastName = dto.lastName;
        if (dto.address !== undefined) update.address = dto.address;
        if (dto.phoneNumber !== undefined) update.phoneNumber = dto.phoneNumber;

        if (Object.keys(update).length === 0) {
            const err = new Error('Không có dữ liệu để cập nhật.');
            err.statusCode = 400;
            throw err;
        }

        await User.updateOne({ _id: userId }, { $set: update });

        const updated = await User.findById(userId).select('-password');
        return UserResponseDto.fromUser(updated);
    },
    getAllUsers: async (query) => {
        const { q, role, status, page = 1, limit = 10 } = query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { username: regex },
                { email: regex },
                { firstName: regex },
                { lastName: regex },
                { phoneNumber: regex }
            ];
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            User.countDocuments(filter)
        ]);
        return {
            items: users.map(u => ({
                id: u._id.toString(),
                email: u.email,
                username: u.username,
                role: u.role,
                firstName: u.firstName,
                lastName: u.lastName,
                address: u.address,
                phoneNumber: u.phoneNumber,
                status: u.status,
                loyaltyPoints: u.loyaltyPoints,
                createdAt: u.createdAt
            })),
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit) || 1
        };
    },
    updateUserByAdmin: async (userId, updateData) => {
        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('Người dùng không tồn tại.');
            err.statusCode = 404;
            throw err;
        }
        const allowedUpdates = ['role', 'status'];
        const update = {};
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                update[field] = updateData[field];
            }
        });
        if (Object.keys(update).length === 0) {
            const err = new Error('Không có dữ liệu hợp lệ để cập nhật.');
            err.statusCode = 400;
            throw err;
        }
        await User.updateOne({ _id: userId }, { $set: update });
        const updated = await User.findById(userId).select('-password');
        return updated;
    }
};

module.exports = UserService;
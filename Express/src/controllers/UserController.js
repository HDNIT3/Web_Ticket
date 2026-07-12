const UserService = require('../services/UserService');
const EditProfileResponseDto = require('../dtos/response/EditProfileResponseDto');
const GetProfileResponseDto = require('../dtos/response/GetProfileResponseDto');    
const UserController = {
    getProfile: async (req, res) => {
        try {
            const data = await UserService.getProfile(req.user.id);
            return res.status(200).json(GetProfileResponseDto.ok(data));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                GetProfileResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
    updateProfile: async (req, res) => {
        try {
            const data = await UserService.updateProfile(req.user.id, req.dto);
            return res.status(200).json(EditProfileResponseDto.ok(data));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                EditProfileResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
    getUsersByAdmin: async (req, res) => {
        try {
            const data = await UserService.getAllUsers(req.query);
            return res.status(200).json({ success: true, message: 'Lấy danh sách người dùng thành công!', data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi lấy danh sách người dùng.'
            });
        }
    },
    updateUserByAdmin: async (req, res) => {
        try {
            const data = await UserService.updateUserByAdmin(req.params.id, req.body);
            return res.status(200).json({ success: true, message: 'Cập nhật người dùng thành công!', data });
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Đã xảy ra lỗi khi cập nhật người dùng.'
            });
        }
    }
};

module.exports = UserController;
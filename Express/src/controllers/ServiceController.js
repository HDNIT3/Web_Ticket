const ServiceCatalogService = require('../services/ServiceCatalogService');
const ServiceResponseDto = require('../dtos/response/ServiceResponseDto');

const ServiceController = {
    getServices: async (req, res) => {
        try {
            const data = await ServiceCatalogService.getServices(req.query);
            return res.status(200).json(ServiceResponseDto.ok(data, 'Lấy danh sách dịch vụ thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ServiceResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    getServiceById: async (req, res) => {
        try {
            const data = await ServiceCatalogService.getServiceById(req.params.id);
            return res.status(200).json(ServiceResponseDto.ok(data, 'Lấy dịch vụ thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ServiceResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    createService: async (req, res) => {
        try {
            const data = await ServiceCatalogService.createService(req.dto);
            return res.status(201).json(ServiceResponseDto.ok(data, 'Tạo dịch vụ thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ServiceResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    updateService: async (req, res) => {
        try {
            const data = await ServiceCatalogService.updateService(req.params.id, req.dto);
            return res.status(200).json(ServiceResponseDto.ok(data, 'Cập nhật dịch vụ thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ServiceResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    deleteService: async (req, res) => {
        try {
            await ServiceCatalogService.deleteService(req.params.id);
            return res.status(200).json(ServiceResponseDto.ok(null, 'Xóa dịch vụ thành công!'));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ServiceResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
};

module.exports = ServiceController;


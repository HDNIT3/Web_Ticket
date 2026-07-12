const adminAuth = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện thao tác này.',
            data: null,
        });
    }

    next();
};

module.exports = adminAuth;
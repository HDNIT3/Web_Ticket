const RegisterRequestDto  = require('../dtos/request/RegisterRequestDto');
const VerifyOtpRequestDto = require('../dtos/request/VerifyOtpRequestDto');
const ResendOtpRequestDto = require('../dtos/request/ResendOtpRequestDto');
const LoginRequestDto     = require('../dtos/request/LoginRequestDto');
const ForgotPasswordRequestDto = require('../dtos/request/ForgotPasswordRequestDto');
const ResetPasswordRequestDto  = require('../dtos/request/ResetPasswordRequestDto');
const EditProfileRequestDto    = require('../dtos/request/EditProfileRequestDto');
const CreateMovieRequestDto = require('../dtos/request/CreateMovieRequestDto');
const UpdateMovieRequestDto = require('../dtos/request/UpdateMovieRequestDto');
const CreateGenreRequestDto = require('../dtos/request/CreateGenreRequestDto');
const UpdateGenreRequestDto = require('../dtos/request/UpdateGenreRequestDto');
const CreatePromotionRequestDto = require('../dtos/request/CreatePromotionRequestDto');
const UpdatePromotionRequestDto = require('../dtos/request/UpdatePromotionRequestDto');
const CreateServiceRequestDto = require('../dtos/request/CreateServiceRequestDto');
const UpdateServiceRequestDto = require('../dtos/request/UpdateServiceRequestDto');
const GoogleLoginRequestDto = require('../dtos/request/GoogleLoginRequestDto');

const validationError = (res, errors) => {
    const firstErrorMessage = errors && errors[0] ? errors[0].message : 'Dữ liệu đầu vào không hợp lệ.';
    return res.status(400).json({
        success: false,
        message: firstErrorMessage,
        errors
    });
};

const validateRegister = (req, res, next) => {
    const dto    = new RegisterRequestDto(req.body);
    const errors = dto.validate();

    if (errors.length > 0) return validationError(res, errors);

    req.dto = dto;
    next();
};

const validateVerifyOtp = (req, res, next) => {
    const dto    = new VerifyOtpRequestDto(req.body);
    const errors = dto.validate();

    if (errors.length > 0) return validationError(res, errors);

    req.dto = dto;
    next();
};

const validateResendOtp = (req, res, next) => {
    const dto    = new ResendOtpRequestDto(req.body);
    const errors = dto.validate();

    if (errors.length > 0) return validationError(res, errors);

    req.dto = dto;
    next();
};

const validateLogin = (req, res, next) => {
    const dto    = new LoginRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);

    req.dto = dto;
    next();
}

const validateForgotPassword = (req, res, next) => {
    const dto = new ForgotPasswordRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateResetPassword = (req, res, next) => {
    const dto = new ResetPasswordRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateEditProfile = (req, res, next) => {
    const dto = new EditProfileRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateCreateMovie = (req, res, next) => {
    const dto = new CreateMovieRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateUpdateMovie = (req, res, next) => {
    const dto = new UpdateMovieRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateCreateGenre = (req, res, next) => {
    const dto = new CreateGenreRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateUpdateGenre = (req, res, next) => {
    const dto = new UpdateGenreRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateCreatePromotion = (req, res, next) => {
    const dto = new CreatePromotionRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateUpdatePromotion = (req, res, next) => {
    const dto = new UpdatePromotionRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateCreateService = (req, res, next) => {
    const dto = new CreateServiceRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateUpdateService = (req, res, next) => {
    const dto = new UpdateServiceRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

const validateGoogleLogin = (req, res, next) => {
    const dto = new GoogleLoginRequestDto(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return validationError(res, errors);
    req.dto = dto;
    next();
};

module.exports = {
    validateRegister,
    validateVerifyOtp,
    validateResendOtp,
    validateLogin,
    validateGoogleLogin,
    validateForgotPassword,
    validateResetPassword,
    validateEditProfile,
    validateCreateMovie,
    validateUpdateMovie,
    validateCreateGenre,
    validateUpdateGenre,
    validateCreatePromotion,
    validateUpdatePromotion,
    validateCreateService,
    validateUpdateService,
};


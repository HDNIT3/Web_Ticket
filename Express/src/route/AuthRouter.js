const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const { registerRateLimiter, loginRateLimiter,forgotPasswordRateLimiter  } = require('../middleware/RateLimiter');
const { validateRegister, validateVerifyOtp, validateResendOtp, validateLogin, validateGoogleLogin, validateForgotPassword, validateResetPassword } = require('../middleware/Validation');

router.post('/register', registerRateLimiter, validateRegister, AuthController.register);
router.post('/verify-otp', validateVerifyOtp, AuthController.verifyOtp);
router.post('/resend-otp', registerRateLimiter, validateResendOtp, AuthController.resendOtp);

router.post('/login', loginRateLimiter, validateLogin, AuthController.login);
router.post('/google', loginRateLimiter, validateGoogleLogin, AuthController.googleLogin);
router.get('/session', AuthController.session);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', forgotPasswordRateLimiter, validateForgotPassword, AuthController.forgotPassword);
router.post('/reset-password', validateResetPassword, AuthController.resetPassword);

module.exports = router;


const { Router } = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
} = require('../utils/validators');

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// OTP routes require authentication (user must be logged in to verify phone)
router.post('/send-otp', protect, validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', protect, validate(verifyOtpSchema), verifyOtp);

module.exports = router;

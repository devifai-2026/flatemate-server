const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const otpService = require('../services/otpService');
const passwordService = require('../services/passwordService');

/** POST /api/auth/register */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

/** POST /api/auth/forgot-password */
const forgotPassword = asyncHandler(async (req, res) => {
  const result = await passwordService.forgotPassword(req.body.email);
  res.status(200).json({ success: true, data: result });
});

/** POST /api/auth/reset-password */
const resetPassword = asyncHandler(async (req, res) => {
  const result = await passwordService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ success: true, data: result });
});

/** POST /api/auth/send-otp */
const sendOtp = asyncHandler(async (req, res) => {
  const result = await otpService.sendOtp(req.user.id, req.body.phone);
  res.status(200).json({ success: true, data: result });
});

/** POST /api/auth/verify-otp */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await otpService.verifyOtp(req.user.id, req.body.otp);
  res.status(200).json({ success: true, data: result });
});

module.exports = { register, login, forgotPassword, resetPassword, sendOtp, verifyOtp };

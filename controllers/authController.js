const asyncHandler = require('../utils/asyncHandler');
const otpService = require('../services/otpService');

/** POST /api/auth/send-otp — public, sends OTP to phone */
const sendOtp = asyncHandler(async (req, res) => {
  const result = await otpService.sendOtp(req.body.phone);
  res.status(200).json({ success: true, data: result });
});

/** POST /api/auth/verify-otp — public, verifies OTP + returns JWT */
const verifyOtp = asyncHandler(async (req, res) => {
  const result = await otpService.verifyOtp(req.body.phone, req.body.otp);
  res.status(200).json({ success: true, data: result });
});

module.exports = { sendOtp, verifyOtp };

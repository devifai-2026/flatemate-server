const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * OTP Service — uses MessageCentral SMS API for phone verification.
 *
 * Flow:
 *   1. POST /api/auth/send-otp   → sendOtp(userId, phone)
 *   2. POST /api/auth/verify-otp → verifyOtp(userId, otp)
 *
 * MessageCentral docs: https://www.messagecentral.com/docs
 */

const MESSAGECENTRAL_BASE = process.env.MESSAGECENTRAL_BASE_URL || 'https://cpaas.messagecentral.com';

/**
 * Send OTP to user's phone via MessageCentral.
 */
const sendOtp = async (userId, phone) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Call MessageCentral Send OTP API
  const url = `${MESSAGECENTRAL_BASE}/verification/v3/send`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN,
    },
    body: JSON.stringify({
      countryCode: '91', // India default, can be made dynamic
      customerId: process.env.MESSAGECENTRAL_CUSTOMER_ID,
      flowType: 'SMS',
      mobileNumber: phone.replace(/^\+91/, ''), // strip country code if present
    }),
  });

  const data = await response.json();

  if (!response.ok || data.responseCode !== 200) {
    throw new AppError(
      data.message || 'Failed to send OTP via MessageCentral',
      502
    );
  }

  // Store the verification ID so we can validate later
  user.phone = phone;
  user.otp = {
    verificationId: data.data?.verificationId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  };
  await user.save();

  return { message: 'OTP sent successfully', verificationId: data.data?.verificationId };
};

/**
 * Verify OTP code via MessageCentral.
 */
const verifyOtp = async (userId, otpCode) => {
  const user = await User.findById(userId).select('+otp.verificationId +otp.expiresAt');
  if (!user) throw new AppError('User not found', 404);

  if (!user.otp?.verificationId) {
    throw new AppError('No OTP request found. Please request a new OTP', 400);
  }

  if (user.otp.expiresAt < new Date()) {
    throw new AppError('OTP has expired. Please request a new one', 400);
  }

  // Validate OTP with MessageCentral
  const validateUrl = new URL(`${MESSAGECENTRAL_BASE}/verification/v3/validateOtp`);
  validateUrl.searchParams.set('customerId', process.env.MESSAGECENTRAL_CUSTOMER_ID);
  validateUrl.searchParams.set('verificationId', user.otp.verificationId);
  validateUrl.searchParams.set('code', otpCode);

  const validateResponse = await fetch(validateUrl.toString(), {
    method: 'GET',
    headers: {
      authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN,
    },
  });

  const validateData = await validateResponse.json();

  if (!validateResponse.ok || validateData.data?.verificationStatus !== 'VERIFICATION_COMPLETED') {
    throw new AppError('Invalid or expired OTP', 400);
  }

  // Mark phone as verified
  user.phoneVerified = true;
  user.verified = true; // overall verification
  user.otp = undefined;
  await user.save();

  return { message: 'Phone verified successfully' };
};

module.exports = { sendOtp, verifyOtp };

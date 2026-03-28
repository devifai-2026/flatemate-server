const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const MESSAGECENTRAL_BASE = process.env.MESSAGECENTRAL_BASE_URL || 'https://cpaas.messagecentral.com';
const IS_DEV = process.env.NODE_ENV !== 'production';
const DEV_OTP = '123456';

/**
 * Send OTP to a phone number.
 * Dev mode (npm run dev): hardcoded OTP 123456, no SMS sent.
 * Prod mode (npm run prod): real SMS via MessageCentral.
 */
const sendOtp = async (phone) => {
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');
  console.log(`[OTP] sendOtp called — phone: ${cleanPhone}, NODE_ENV: ${process.env.NODE_ENV}, IS_DEV: ${IS_DEV}`);

  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new AppError('Please provide a valid 10-digit phone number', 400);
  }

  let user = await User.findOne({ phone: cleanPhone });
  if (!user) {
    user = await User.create({ phone: cleanPhone });
    console.log(`[OTP] New user created: ${user._id}`);
  } else {
    console.log(`[OTP] Existing user: ${user._id}`);
  }

  if (IS_DEV) {
    console.log(`[OTP] DEV MODE — OTP for ${cleanPhone}: ${DEV_OTP}`);
    user.otp = {
      verificationId: 'dev-mode',
      code: DEV_OTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };
    await user.save();
    return { message: `OTP sent (dev: ${DEV_OTP})`, verificationId: 'dev-mode' };
  }

  // Production — real SMS via MessageCentral
  console.log(`[OTP] PROD MODE — calling MessageCentral for ${cleanPhone}`);
  const url = `${MESSAGECENTRAL_BASE}/verification/v3/send?countryCode=91&customerId=${process.env.MESSAGECENTRAL_CUSTOMER_ID}&senderId=UTOMOB&type=SMS&flowType=SMS&mobileNumber=${cleanPhone}`;
  console.log(`[OTP] Request URL: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: { authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN },
  });

  const text = await response.text();
  console.log(`[OTP] MessageCentral status: ${response.status}`);
  console.log(`[OTP] MessageCentral body: ${text}`);

  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!response.ok || (data.responseCode && data.responseCode !== 200)) {
    console.error(`[OTP] MessageCentral FAILED:`, data);
    // Rate limit — timeout means wait before retrying
    if (data.data?.timeout) {
      const secs = Math.ceil(parseFloat(data.data.timeout));
      throw new AppError(`Please wait ${secs} seconds before requesting another OTP`, 429);
    }
    throw new AppError(data.message || 'Failed to send OTP', 502);
  }

  console.log(`[OTP] OTP sent. VerificationId: ${data.data?.verificationId}`);
  user.otp = {
    verificationId: data.data?.verificationId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  await user.save();

  return { message: 'OTP sent successfully', verificationId: data.data?.verificationId };
};

/**
 * Verify OTP and return JWT token.
 * In dev mode: accepts 123456 directly.
 * In production: validates via MessageCentral.
 */
const verifyOtp = async (phone, otpCode) => {
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\s/g, '');
  console.log(`[OTP] verifyOtp called — phone: ${cleanPhone}, code: ${otpCode}, IS_DEV: ${IS_DEV}`);

  const user = await User.findOne({ phone: cleanPhone }).select('+otp.verificationId +otp.expiresAt +otp.code');
  if (!user) throw new AppError('No OTP request found for this number', 400);

  if (!user.otp?.verificationId) {
    throw new AppError('No OTP request found. Please request a new OTP', 400);
  }

  if (user.otp.expiresAt < new Date()) {
    throw new AppError('OTP has expired. Please request a new one', 400);
  }

  if (IS_DEV) {
    console.log(`[OTP] DEV verify — stored code: ${user.otp.code}, provided: ${otpCode}`);
    if (otpCode !== user.otp.code) {
      throw new AppError('Invalid OTP. Use 123456 in dev mode.', 400);
    }
  } else {
    // Production — validate with MessageCentral
    const validateUrl = `${MESSAGECENTRAL_BASE}/verification/v3/validateOtp?customerId=${process.env.MESSAGECENTRAL_CUSTOMER_ID}&verificationId=${user.otp.verificationId}&code=${otpCode}`;
    console.log(`[OTP] PROD verify — calling MessageCentral: ${validateUrl}`);

    const validateResponse = await fetch(validateUrl, {
      method: 'GET',
      headers: { authToken: process.env.MESSAGECENTRAL_AUTH_TOKEN },
    });

    const valText = await validateResponse.text();
    console.log(`[OTP] MessageCentral verify status: ${validateResponse.status}`);
    console.log(`[OTP] MessageCentral verify body: ${valText}`);

    let validateData;
    try { validateData = JSON.parse(valText); } catch { validateData = { message: valText }; }

    if (!validateResponse.ok || validateData.data?.verificationStatus !== 'VERIFICATION_COMPLETED') {
      console.error(`[OTP] Verification FAILED:`, validateData);
      throw new AppError(validateData.message || 'Invalid or expired OTP', 400);
    }
  }

  // Mark phone as verified
  user.phoneVerified = true;
  user.verified = true;
  user.otp = undefined;
  await user.save();

  // Generate JWT
  const token = jwt.sign(
    { id: user._id, phone: user.phone, verified: user.verified },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const isNewUser = !user.name || !user.onboardingComplete;

  return {
    token,
    user: {
      _id: user._id,
      phone: user.phone,
      name: user.name,
      verified: user.verified,
      onboardingComplete: user.onboardingComplete,
    },
    isNewUser,
  };
};

module.exports = { sendOtp, verifyOtp };

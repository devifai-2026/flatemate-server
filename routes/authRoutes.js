const { Router } = require('express');
const { sendOtp, verifyOtp } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { sendOtpSchema, verifyOtpSchema } = require('../utils/validators');

const router = Router();

// Both are public — no auth needed
router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);

module.exports = router;

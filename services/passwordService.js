const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendPasswordResetEmail } = require('./emailService');

/**
 * Forgot Password — generates a reset token, saves hashed version, emails the link.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('No account found with that email', 404);

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(email, resetToken);
    return { message: 'Password reset link sent to your email' };
  } catch {
    // Rollback token if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError('Failed to send reset email. Try again later', 500);
  }
};

/**
 * Reset Password — validates the token and sets the new password.
 */
const resetPassword = async (token, newPassword) => {
  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been reset successfully' };
};

module.exports = { forgotPassword, resetPassword };

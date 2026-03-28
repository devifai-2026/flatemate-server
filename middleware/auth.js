const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Protects routes by verifying JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 * Rejects blocked users.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Not authorized — no token provided', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is blocked
    const user = await User.findById(decoded.id).select('isBlocked').lean();
    if (user?.isBlocked) {
      return next(new AppError('Your account has been blocked. Contact support.', 403));
    }

    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Not authorized — invalid token', 401));
  }
};

/**
 * Restricts access to verified users only.
 * Must be used AFTER the protect middleware.
 */
const verifiedOnly = (req, res, next) => {
  if (!req.user.verified) {
    return next(new AppError('This action requires a verified account', 403));
  }
  next();
};

module.exports = { protect, verifiedOnly };

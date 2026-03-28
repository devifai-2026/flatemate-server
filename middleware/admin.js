const User = require('../models/User');
const AppError = require('../utils/AppError');

const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('isAdmin').lean();
  if (!user?.isAdmin) return next(new AppError('Admin access required', 403));
  next();
};

module.exports = { adminOnly };

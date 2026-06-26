const User = require('../models/User');
const AppError = require('../utils/AppError');

// Loads the user, rejects non-admins, and stashes the admin role on req.user
// so downstream middleware/handlers can branch on it.
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.user.id).select('isAdmin role').lean();
  if (!user?.isAdmin) return next(new AppError('Admin access required', 403));
  req.user.role = user.role || 'admin';
  next();
};

// Restricts a route to full ('admin') access only — blocks the 'lister' role.
// Must run AFTER adminOnly (which sets req.user.role).
const fullAdminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('This section is not available for your role', 403));
  }
  next();
};

module.exports = { adminOnly, fullAdminOnly };

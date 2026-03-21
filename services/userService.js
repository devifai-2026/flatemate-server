const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Get the current user's full profile.
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * Update a user's preferences sub-document.
 */
const updatePreferences = async (userId, preferences) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { preferences },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = { getProfile, updatePreferences };

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

/**
 * Update own profile (name, profileImage, age, gender, etc.)
 */
const updateProfile = async (userId, data) => {
  const allowed = ['name', 'profileImage', 'age', 'gender', 'occupation', 'bio', 'city', 'email'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = { getProfile, updatePreferences, updateProfile };

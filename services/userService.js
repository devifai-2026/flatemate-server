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
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  // Name can only be edited once
  if ((data.firstName || data.surname) && user.nameEdited) {
    throw new AppError('Name can only be edited once', 400);
  }

  const allowed = ['firstName', 'surname', 'profileImage', 'age', 'gender', 'occupation', 'bio', 'city', 'email'];
  for (const key of allowed) {
    if (data[key] !== undefined) user[key] = data[key];
  }

  // Auto-generate full name from firstName + surname
  if (data.firstName || data.surname) {
    user.name = [user.firstName, user.surname].filter(Boolean).join(' ');
    user.nameEdited = true;
  }

  await user.save();
  return user;
};

module.exports = { getProfile, updatePreferences, updateProfile };

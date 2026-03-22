const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Onboarding Step 1: Set user type, gender, city, profile image/avatar.
 */
const completeStep1 = async (userId, { userType, gender, city, profileImage }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.userType = userType;
  if (gender) user.gender = gender;
  if (city) user.city = city;
  if (profileImage) user.profileImage = profileImage;

  await user.save();
  return user;
};

/**
 * Onboarding Step 2: Set lifestyle tags (minimum 5).
 */
const completeStep2 = async (userId, { lifestyleTags }) => {
  if (!lifestyleTags || lifestyleTags.length < 5) {
    throw new AppError('Please select at least 5 lifestyle tags', 400);
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      lifestyleTags,
      onboardingComplete: true,
    },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError('User not found', 404);
  return user;
};

/**
 * Update user location coordinates (for distance calculation).
 */
const updateLocation = async (userId, { lat, lng }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    },
    { new: true }
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
};

module.exports = { completeStep1, completeStep2, updateLocation };
